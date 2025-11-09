from fastapi import APIRouter, HTTPException
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.dependencies import SessionDep, UserIdDep
from app.models import Review, Todo, Topic
from app.schemas import ReviewCreate, ReviewUpdate, ReviewWithTopic

router = APIRouter()


@router.get("/reviews/", tags=["reviews"])
async def read_reviews(
    session: SessionDep,
    user_id: UserIdDep,
    todo_id: int | None = None,
    topic_id: int | None = None,
) -> list[ReviewWithTopic]:
    """Get all reviews for the user, with optional filters for todo_id and topic_id."""
    stmt = (
        select(Review)
        .where(Review.user_id == user_id)
        .options(selectinload(Review.topic), selectinload(Review.todo))
    )

    if todo_id is not None:
        stmt = stmt.where(Review.todo_id == todo_id)

    if topic_id is not None:
        stmt = stmt.where(Review.topic_id == topic_id)

    stmt = stmt.order_by(Review.updated_at.desc())

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/reviews/{review_id}/", tags=["reviews"])
async def read_review(
    session: SessionDep,
    user_id: UserIdDep,
    review_id: int,
) -> ReviewWithTopic:
    """Get a specific review by id."""
    stmt = (
        select(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .options(selectinload(Review.topic), selectinload(Review.todo))
    )

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
) -> ReviewWithTopic:
    """Create a new review."""
    # Verify todo exists and belongs to user
    todo_result = await session.execute(
        select(Todo).where(Todo.id == review.todo_id, Todo.user_id == user_id)
    )
    todo = todo_result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    # Verify topic exists and belongs to user
    topic_result = await session.execute(
        select(Topic).where(Topic.id == review.topic_id, Topic.user_id == user_id)
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    new_review = Review(
        todo_id=review.todo_id,
        topic_id=review.topic_id,
        user_id=user_id,
        rating=review.rating,
    )
    session.add(new_review)

    try:
        await session.flush()
    except IntegrityError:
        raise HTTPException(
            status_code=409, detail="Review already exists for this todo-topic pair"
        )

    # Refresh with topic relationship loaded
    await session.refresh(new_review, ["topic", "todo"])
    return new_review


@router.post("/reviews/{review_id}/", tags=["reviews"])
async def update_review(
    review_id: int,
    review: ReviewUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithTopic:
    """Update a review's rating."""
    # Update the review
    update_stmt = (
        update(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .values(rating=review.rating)
    )
    result = await session.execute(update_stmt)

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Review not found")

    # Fetch and return updated review with topic loaded
    stmt = (
        select(Review)
        .where(Review.id == review_id)
        .options(selectinload(Review.topic), selectinload(Review.todo))
    )
    result = await session.execute(stmt)
    return result.scalar_one()


@router.delete("/reviews/{review_id}/", tags=["reviews"])
async def delete_review(
    review_id: int,
    session: SessionDep,
    user_id: UserIdDep,
):
    """Delete a review."""
    stmt = (
        delete(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .returning(Review)
    )
    result = await session.execute(stmt)
    deleted_review = result.scalar_one_or_none()

    if not deleted_review:
        raise HTTPException(status_code=404, detail="Review not found")

    return {"message": "Review deleted successfully"}
