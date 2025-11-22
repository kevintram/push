from fastapi import APIRouter, HTTPException
from app.dependencies import UserIdDep, SessionDep
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from app.models import Review, Topic, TopicReview
from app.schemas import (
    ReviewCreate,
    ReviewRead,
    ReviewUpdate,
    TopicRead,
    ReviewReadWithTopicReviews,
)
from app.routers.topic_reviews import replay_reviews_from_date

router = APIRouter()


@router.get("/reviews/", tags=["reviews"])
async def read_reviews(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int | None = None,
) -> list[ReviewReadWithTopicReviews]:
    stmt = (
        select(Review)
        .where(Review.user_id == user_id)
        .order_by(Review.completed_at.asc().nulls_first(), Review.scheduled_at.asc())
        .options(selectinload(Review.topic_reviews).selectinload(TopicReview.topic))
    )

    if topic_id is not None:
        stmt = stmt.where(Review.topics.any(Topic.id == topic_id))

    result = await session.execute(stmt)
    ret = result.scalars().all()
    return ret


@router.get("/reviews/{review_id}/", tags=["reviews"])
async def read_review(
    session: SessionDep, user_id: UserIdDep, review_id: int
) -> ReviewReadWithTopicReviews:
    stmt = select(Review).where(Review.id == review_id, Review.user_id == user_id)
    stmt = stmt.options(selectinload(Review.topic_reviews).selectinload(TopicReview.topic))
    result = await session.execute(stmt)

    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    return review


@router.post("/reviews/", tags=["reviews"])
async def create_review(
    review: ReviewCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewRead:
    new_review = Review(
        description=review.description,
        scheduled_at=review.scheduled_at,
        completed_at=review.completed_at,
        user_id=user_id,
    )
    session.add(new_review)
    await session.flush()
    await session.refresh(new_review)
    return new_review


@router.post("/reviews/{review_id}", tags=["reviews"])
async def update_review(
    review_id: int,
    review: ReviewUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewRead:
    update_values = review.model_dump(exclude_unset=True, exclude={"id", "user_id"})
    if not update_values:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Fetch the old review to check if completed_at is changing
    old_review_result = await session.execute(
        select(Review).where(Review.id == review_id, Review.user_id == user_id)
    )
    old_review = old_review_result.scalar_one_or_none()
    if not old_review:
        raise HTTPException(status_code=404, detail="Review not found")
    old_completed_at = old_review.completed_at

    # Perform the update
    update_stmt = (
        update(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .values(update_values)
    )
    result = await session.execute(update_stmt)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Review not found")

    # check if completed_at is changing
    completed_at_changed = (
        "completed_at" in update_values
        and update_values["completed_at"] != old_completed_at
    )
    print(f"completed_at_changed: {completed_at_changed}")
    if not completed_at_changed:
        # fetch and return updated review
        stmt = (
            select(Review)
            .where(Review.id == review_id, Review.user_id == user_id)
            .options(selectinload(Review.topic_reviews).selectinload(TopicReview.topic))
        )
        final_result = await session.execute(stmt)
        return final_result.scalar_one()
    
    # since completed_at is changing, we need to update corresponding topic reviews
    new_completed_at = update_values.get("completed_at")
    # Case 1: Review became completed (None → date)
    if old_completed_at is None and new_completed_at is not None:
        print("due is none -> date, so set rating -> good")
        # Set all null ratings to "good"
        await session.execute(
            update(TopicReview)
            .where(
                TopicReview.review_id == review_id,
                TopicReview.user_id == user_id,
                TopicReview.rating.is_(None)
            )
            .values(rating="good")
        )
        await session.flush()
    # Case 2: Review became uncompleted (date → None)
    elif old_completed_at is not None and new_completed_at is None:
        print("due is date -> none, so set rating -> none")
        # Set all ratings back to None
        await session.execute(
            update(TopicReview)
            .where(TopicReview.review_id == review_id, TopicReview.user_id == user_id)
            .values(rating=None)
        )
        await session.flush()
    
    # Run FSRS for all affected topics, starting from earliest affected date
    if completed_at_changed:
        replay_from_date = None
        if old_completed_at is not None and new_completed_at is not None:
            replay_from_date = min(old_completed_at, new_completed_at)
        elif old_completed_at is not None:
            replay_from_date = old_completed_at
        elif new_completed_at is not None:
            replay_from_date = new_completed_at

        if replay_from_date:
            reviews_result = await session.execute(
                select(TopicReview.topic_id)
                .where(TopicReview.review_id == review_id, TopicReview.user_id == user_id)
                .distinct()
            )
            affected_topic_ids = {row[0] for row in reviews_result.all()}

            for topic_id in affected_topic_ids:
                await replay_reviews_from_date(
                    session=session,
                    topic_id=topic_id,
                    user_id=user_id,
                    from_date=replay_from_date,
                )

    stmt = (
        select(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .options(selectinload(Review.topic_reviews).selectinload(TopicReview.topic))
    )
    final_result = await session.execute(stmt)
    return final_result.scalar_one()


@router.get("/reviews/{review_id}/topics/", tags=["reviews"])
async def read_topics_for_review(
    review_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[TopicRead]:
    stmt = select(Topic).where(
        Topic.reviews.any(Review.id == review_id), Topic.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.delete("/reviews/{review_id}", tags=["reviews"])
async def delete_review(review_id: int, session: SessionDep, user_id: UserIdDep):
    # Fetch the review to check if it has a completion date
    review_result = await session.execute(
        select(Review).where(Review.id == review_id, Review.user_id == user_id)
    )
    review = review_result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    completed_at = review.completed_at

    # Fetch all topic reviews associated with this review to get affected topic IDs
    reviews_result = await session.execute(
        select(TopicReview.topic_id)
        .where(TopicReview.review_id == review_id, TopicReview.user_id == user_id)
        .distinct()
    )
    affected_topic_ids = {row[0] for row in reviews_result.all()}

    # Delete the review (topic reviews will be cascade deleted if DB is configured that way)
    stmt = delete(Review).where(Review.id == review_id, Review.user_id == user_id)
    await session.execute(stmt)

    # Only replay if the review was completed (had a completion date)
    if completed_at and affected_topic_ids:
        for topic_id in affected_topic_ids:
            await replay_reviews_from_date(
                session=session,
                topic_id=topic_id,
                user_id=user_id,
                from_date=completed_at,
            )

    return {"message": "Review deleted successfully"}
