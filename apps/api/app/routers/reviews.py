from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fsrs import Card, Rating as FSRSRating, Scheduler, State as FSRSState
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.dependencies import SessionDep, UserIdDep
from app.models import Review, Todo, Topic
from app.schemas import ReviewCreate, ReviewUpdate, ReviewWithTopic

router = APIRouter()


def map_rating_to_fsrs(rating: str) -> FSRSRating:
    """Map database rating string to FSRS Rating enum."""
    mapping = {
        "miss": FSRSRating.Again,
        "hard": FSRSRating.Hard,
        "good": FSRSRating.Good,
        "easy": FSRSRating.Easy,
    }
    return mapping[rating]


def map_state_to_fsrs(state: str) -> FSRSState:
    """Map database state string to FSRS State enum."""
    mapping = {
        "LEARNING": FSRSState.Learning,
        "REVIEW": FSRSState.Review,
        "RELEARNING": FSRSState.Relearning,
    }
    return mapping[state]


def map_fsrs_state_to_db(state: FSRSState) -> str:
    """Map FSRS State enum to database string."""
    mapping = {
        FSRSState.Learning: "LEARNING",
        FSRSState.Review: "REVIEW",
        FSRSState.Relearning: "RELEARNING",
    }
    return mapping[state]


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

    # Store topic's current state as "before" state
    topic_stability_before = topic.stability
    topic_difficulty_before = topic.difficulty
    topic_state_before = topic.state
    topic_step_before = topic.step
    topic_due_before = topic.due

    # Initialize FSRS scheduler with default parameters
    scheduler = Scheduler()

    # Create a Card representing the topic's current state
    card = Card(
        state=map_state_to_fsrs(topic.state),
        stability=topic.stability,
        difficulty=topic.difficulty,
        step=topic.step,
    )

    # Review the card with FSRS
    fsrs_rating = map_rating_to_fsrs(review.rating)
    review_datetime = datetime.now(timezone.utc)
    updated_card, review_log = scheduler.review_card(
        card=card,
        rating=fsrs_rating,
        review_datetime=review_datetime
    )

    # Calculate due_after as a date (extract date from datetime)
    due_after_date = updated_card.due.date()

    # Create the review with FSRS state
    new_review = Review(
        todo_id=review.todo_id,
        topic_id=review.topic_id,
        user_id=user_id,
        rating=review.rating,
        # Topic before state
        topic_stability_before=topic_stability_before,
        topic_difficulty_before=topic_difficulty_before,
        topic_state_before=topic_state_before,
        topic_step_before=topic_step_before,
        topic_due_before=topic_due_before,
        # Topic after state
        topic_stability_after=updated_card.stability,
        topic_difficulty_after=updated_card.difficulty,
        topic_state_after=map_fsrs_state_to_db(updated_card.state),
        topic_step_after=updated_card.step,
        topic_due_after=due_after_date,
    )
    session.add(new_review)

    try:
        await session.flush()
    except IntegrityError:
        raise HTTPException(
            status_code=409, detail="Review already exists for this todo-topic pair"
        )

    # Update the topic with new FSRS state
    topic.stability = updated_card.stability
    topic.difficulty = updated_card.difficulty
    topic.state = map_fsrs_state_to_db(updated_card.state)
    topic.step = updated_card.step
    topic.due = due_after_date

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
    """Update a review's rating and recalculate FSRS state."""
    # Fetch the existing review
    review_result = await session.execute(
        select(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .options(selectinload(Review.topic))
    )
    existing_review = review_result.scalar_one_or_none()

    if not existing_review:
        raise HTTPException(status_code=404, detail="Review not found")

    topic = existing_review.topic

    # Initialize FSRS scheduler with default parameters
    scheduler = Scheduler()

    # Create a Card from the review's "before" state
    # This represents the topic state BEFORE this review was originally made
    card = Card(
        state=map_state_to_fsrs(existing_review.topic_state_before) if existing_review.topic_state_before else FSRSState.Learning,
        stability=existing_review.topic_stability_before,
        difficulty=existing_review.topic_difficulty_before,
        step=existing_review.topic_step_before,
    )

    # Review the card with the NEW rating
    fsrs_rating = map_rating_to_fsrs(review.rating)
    review_datetime = datetime.now(timezone.utc)
    updated_card, review_log = scheduler.review_card(
        card=card,
        rating=fsrs_rating,
        review_datetime=review_datetime
    )

    # Calculate new topic_due_after as a date
    due_after_date = updated_card.due.date()

    # Update the review with new rating and "after" state
    existing_review.rating = review.rating
    existing_review.topic_stability_after = updated_card.stability
    existing_review.topic_difficulty_after = updated_card.difficulty
    existing_review.topic_state_after = map_fsrs_state_to_db(updated_card.state)
    existing_review.topic_step_after = updated_card.step
    existing_review.topic_due_after = due_after_date

    # Update the topic with new FSRS state
    topic.stability = updated_card.stability
    topic.difficulty = updated_card.difficulty
    topic.state = map_fsrs_state_to_db(updated_card.state)
    topic.step = updated_card.step
    topic.due = due_after_date

    await session.flush()

    # Refresh and return with relationships loaded
    await session.refresh(existing_review, ["topic", "todo"])
    return existing_review


@router.delete("/reviews/{review_id}/", tags=["reviews"])
async def delete_review(
    review_id: int,
    session: SessionDep,
    user_id: UserIdDep,
):
    """Delete a review and restore topic to its before state."""
    # Fetch the review with topic before deleting
    review_result = await session.execute(
        select(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .options(selectinload(Review.topic))
    )
    review = review_result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    topic = review.topic

    # Restore topic to its "before" state
    topic.stability = review.topic_stability_before
    topic.difficulty = review.topic_difficulty_before
    topic.state = review.topic_state_before
    topic.step = review.topic_step_before
    topic.due = review.topic_due_before

    # Delete the review
    await session.delete(review)
    await session.flush()

    return {"message": "Review deleted successfully"}
