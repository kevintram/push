from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.dependencies import UserIdDep, SessionDep
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from app.models import ReviewSession, Topic, Review
from app.schemas import (
    ReviewSessionCreate,
    ReviewSessionRead,
    ReviewSessionUpdate,
    TopicRead,
    ReviewSessionReadWithReviews,
)
from app.routers.reviews import replay_reviews_from_date

router = APIRouter()


@router.get("/review-sessions/", tags=["review-sessions"])
async def read_review_sessions(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int | None = None,
    effective_date_before: str | None = None,
    effective_date_after: str | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
) -> list[ReviewSessionReadWithReviews]:
    stmt = (
        select(ReviewSession)
        .where(ReviewSession.user_id == user_id)
        .order_by(ReviewSession.completed_at.asc().nulls_first(), ReviewSession.scheduled_at.asc(), ReviewSession.id.asc())
        .options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    )

    if topic_id is not None:
        stmt = stmt.where(ReviewSession.reviews.any(Review.topic_id == topic_id))

    if effective_date_before is not None:
        date_before = datetime.strptime(effective_date_before, '%Y-%m-%d').date()
        stmt = stmt.where(ReviewSession.effective_date <= date_before)

    if effective_date_after is not None:
        date_after = datetime.strptime(effective_date_after, '%Y-%m-%d').date()
        stmt = stmt.where(ReviewSession.effective_date >= date_after)

    if completed is not None:
        if completed:
            stmt = stmt.where(ReviewSession.completed_at.isnot(None))
        else:
            stmt = stmt.where(ReviewSession.completed_at.is_(None))

    if scheduled is not None:
        if scheduled:
            stmt = stmt.where(ReviewSession.scheduled_at.isnot(None))
        else:
            stmt = stmt.where(ReviewSession.scheduled_at.is_(None))

    result = await session.execute(stmt)
    ret = result.scalars().all()
    return ret


@router.get("/review-sessions/{review_session_id}/", tags=["review-sessions"])
async def read_review_session(
    session: SessionDep, user_id: UserIdDep, review_session_id: int
) -> ReviewSessionReadWithReviews:
    stmt = select(ReviewSession).where(ReviewSession.id == review_session_id, ReviewSession.user_id == user_id)
    stmt = stmt.options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    result = await session.execute(stmt)

    review_session = result.scalar_one_or_none()
    if not review_session:
        raise HTTPException(status_code=404, detail="Review Session not found")

    return review_session


@router.post("/review-sessions/", tags=["review-sessions"])
async def create_review_session(
    review_session: ReviewSessionCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewSessionRead:
    new_review_session = ReviewSession(
        description=review_session.description,
        notes=review_session.notes,
        scheduled_at=review_session.scheduled_at,
        completed_at=review_session.completed_at,
        user_id=user_id,
    )
    session.add(new_review_session)
    await session.flush()
    await session.refresh(new_review_session)
    return new_review_session


@router.post("/review-sessions/{review_session_id}", tags=["review-sessions"])
async def update_review_session(
    review_session_id: int,
    review_session: ReviewSessionUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewSessionRead:
    update_values = review_session.model_dump(exclude_unset=True, exclude={"id", "user_id"})
    if not update_values:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Fetch the old review session to check if completed_at is changing
    old_review_session_result = await session.execute(
        select(ReviewSession).where(ReviewSession.id == review_session_id, ReviewSession.user_id == user_id)
    )
    old_review_session = old_review_session_result.scalar_one_or_none()
    if not old_review_session:
        raise HTTPException(status_code=404, detail="Review Session not found")
    old_completed_at = old_review_session.completed_at

    # Perform the update
    update_stmt = (
        update(ReviewSession)
        .where(ReviewSession.id == review_session_id, ReviewSession.user_id == user_id)
        .values(update_values)
    )
    result = await session.execute(update_stmt)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Review Session not found")

    # check if completed_at is changing
    completed_at_changed = (
        "completed_at" in update_values
        and update_values["completed_at"] != old_completed_at
    )
    if not completed_at_changed:
        # fetch and return updated review session
        stmt = (
            select(ReviewSession)
            .where(ReviewSession.id == review_session_id, ReviewSession.user_id == user_id)
            .options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
        )
        final_result = await session.execute(stmt)
        return final_result.scalar_one()
    
    # since completed_at is changing, we need to update corresponding reviews (formerly topic reviews)
    new_completed_at = update_values.get("completed_at")
    # Case 1: Review Session became completed (None → date)
    if old_completed_at is None and new_completed_at is not None:
        # Set all null ratings to "good" and set completion date for reviews
        await session.execute(
            update(Review)
            .where(
                Review.review_session_id == review_session_id,
                Review.user_id == user_id,
                Review.rating.is_(None)
            )
            .values(rating="good", completed_at=new_completed_at)
        )
        await session.flush()
    # Case 2: Review Session became uncompleted (date → None)
    elif old_completed_at is not None and new_completed_at is None:
        # Set all ratings back to None and clear completion date for reviews
        await session.execute(
            update(Review)
            .where(Review.review_session_id == review_session_id, Review.user_id == user_id)
            .values(rating=None, completed_at=None)
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
                select(Review.topic_id)
                .where(Review.review_session_id == review_session_id, Review.user_id == user_id)
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
        select(ReviewSession)
        .where(ReviewSession.id == review_session_id, ReviewSession.user_id == user_id)
        .options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    )
    final_result = await session.execute(stmt)
    return final_result.scalar_one()


@router.get("/review-sessions/{review_session_id}/topics/", tags=["review-sessions"])
async def read_topics_for_review_session(
    review_session_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[TopicRead]:
    stmt = select(Topic).where(
        Topic.reviews.any(Review.review_session_id == review_session_id), Topic.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.delete("/review-sessions/{review_session_id}", tags=["review-sessions"])
async def delete_review_session(review_session_id: int, session: SessionDep, user_id: UserIdDep):
    # Fetch the review session to check if it has a completion date
    review_session_result = await session.execute(
        select(ReviewSession).where(ReviewSession.id == review_session_id, ReviewSession.user_id == user_id)
    )
    review_session = review_session_result.scalar_one_or_none()

    if not review_session:
        raise HTTPException(status_code=404, detail="Review Session not found")

    completed_at = review_session.completed_at

    # Fetch all reviews associated with this review session to get affected topic IDs
    reviews_result = await session.execute(
        select(Review.topic_id)
        .where(Review.review_session_id == review_session_id, Review.user_id == user_id)
        .distinct()
    )
    affected_topic_ids = {row[0] for row in reviews_result.all()}

    # Delete the review session (reviews will be cascade deleted if DB is configured that way)
    stmt = delete(ReviewSession).where(ReviewSession.id == review_session_id, ReviewSession.user_id == user_id)
    await session.execute(stmt)

    # Only replay if the review session was completed (had a completion date)
    if completed_at and affected_topic_ids:
        for topic_id in affected_topic_ids:
            await replay_reviews_from_date(
                session=session,
                topic_id=topic_id,
                user_id=user_id,
                from_date=completed_at,
            )

    return {"message": "Review Session deleted successfully"}