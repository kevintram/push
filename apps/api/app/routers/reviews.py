from datetime import datetime, timezone, date

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


async def replay_subsequent_reviews(
    topic: Topic,
    starting_card: Card,
    subsequent_reviews: list[Review],
    scheduler: Scheduler,
) -> Card:
    """
    Replay a list of reviews in chronological order, updating their before/after states.

    Args:
        topic: The topic being reviewed
        starting_card: The card state to start replaying from
        subsequent_reviews: List of reviews to replay, ordered by todo.completed_at ASC
        scheduler: FSRS scheduler instance

    Returns:
        The final card state after all reviews have been replayed
    """
    current_card = starting_card

    for review in subsequent_reviews:
        # Update this review's "before" state to match current card state
        review.topic_stability_before = current_card.stability
        review.topic_difficulty_before = current_card.difficulty
        review.topic_state_before = map_fsrs_state_to_db(current_card.state)
        review.topic_step_before = current_card.step
        review.topic_due_before = current_card.due.date() if hasattr(current_card.due, 'date') else current_card.due

        # Review the card with this review's rating
        fsrs_rating = map_rating_to_fsrs(review.rating)
        review_datetime = datetime.now(timezone.utc)
        updated_card, review_log = scheduler.review_card(
            card=current_card,
            rating=fsrs_rating,
            review_datetime=review_datetime
        )

        # Update this review's "after" state with the new calculation
        review.topic_stability_after = updated_card.stability
        review.topic_difficulty_after = updated_card.difficulty
        review.topic_state_after = map_fsrs_state_to_db(updated_card.state)
        review.topic_step_after = updated_card.step
        review.topic_due_after = updated_card.due.date()

        # This becomes the starting point for the next review
        current_card = updated_card

    return current_card


async def replay_reviews_from_date(
    session: SessionDep,
    topic_id: int,
    user_id: str,
    from_date: date,
) -> None:
    """
    Replay reviews for a topic starting from a specific date.

    Only replays reviews where todo.completed_at >= from_date.
    More efficient than replaying all reviews when only later reviews are affected.

    Args:
        session: Database session
        topic_id: ID of the topic to replay
        user_id: User ID for authorization
        from_date: Only replay reviews with todo.completed_at >= from_date
    """
    # Fetch the topic
    topic_result = await session.execute(
        select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        return

    # Fetch completed reviews from from_date onward
    reviews_result = await session.execute(
        select(Review)
        .join(Todo, Review.todo_id == Todo.id)
        .where(
            Review.topic_id == topic_id,
            Review.user_id == user_id,
            Todo.completed_at.isnot(None),
            Todo.completed_at >= from_date,
        )
        .order_by(Todo.completed_at.asc())
        .options(selectinload(Review.todo))
    )
    reviews_to_replay = list(reviews_result.scalars().all())

    if not reviews_to_replay:
        # No reviews to replay
        return

    # Find the last review BEFORE from_date to get starting FSRS state
    before_review_result = await session.execute(
        select(Review)
        .join(Todo, Review.todo_id == Todo.id)
        .where(
            Review.topic_id == topic_id,
            Review.user_id == user_id,
            Todo.completed_at.isnot(None),
            Todo.completed_at < from_date,
        )
        .order_by(Todo.completed_at.desc())
        .limit(1)
    )
    last_before_review = before_review_result.scalar_one_or_none()

    # Initialize FSRS scheduler
    scheduler = Scheduler()

    # Determine starting card state
    if last_before_review and last_before_review.topic_stability_after is not None:
        # Start from the "after" state of the last review before from_date
        starting_card = Card(
            state=map_state_to_fsrs(last_before_review.topic_state_after),
            stability=last_before_review.topic_stability_after,
            difficulty=last_before_review.topic_difficulty_after,
            step=last_before_review.topic_step_after,
        )
    else:
        # No prior reviews or no FSRS state, start from initial state
        starting_card = Card(
            state=FSRSState.Learning,
            stability=None,
            difficulty=None,
            step=None,
        )

    # Replay reviews from the determined starting state
    final_card = await replay_subsequent_reviews(
        topic=topic,
        starting_card=starting_card,
        subsequent_reviews=reviews_to_replay,
        scheduler=scheduler,
    )

    # Update topic with final state
    topic.stability = final_card.stability
    topic.difficulty = final_card.difficulty
    topic.state = map_fsrs_state_to_db(final_card.state)
    topic.step = final_card.step
    topic.due = final_card.due.date()

    await session.flush()


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

    # Check if todo is completed - only run FSRS if it is
    if todo.completed_at is None:
        # Todo not completed yet - create review without FSRS or rating
        new_review = Review(
            todo_id=review.todo_id,
            topic_id=review.topic_id,
            user_id=user_id,
            # All FSRS fields remain None
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

    # Todo is completed - run FSRS
    # Store topic's current state as "before" state
    topic_stability_before = topic.stability
    topic_difficulty_before = topic.difficulty
    topic_state_before = topic.state
    topic_step_before = topic.step
    topic_due_before = topic.due

    # Use provided rating or default to "good"
    rating_value = review.rating or "good"

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
    fsrs_rating = map_rating_to_fsrs(rating_value)
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
        rating=rating_value,
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

    # Replay all reviews that come after this newly created review
    await replay_reviews_from_date(
        session=session,
        topic_id=topic.id,
        user_id=user_id,
        from_date=todo.completed_at,
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
    """Update a review's rating and recalculate FSRS state."""
    # Fetch the existing review with todo and topic
    review_result = await session.execute(
        select(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .options(selectinload(Review.topic), selectinload(Review.todo))
    )
    existing_review = review_result.scalar_one_or_none()

    if not existing_review:
        raise HTTPException(status_code=404, detail="Review not found")

    topic = existing_review.topic
    todo = existing_review.todo

    # Check if todo is completed - only run FSRS if it is
    if todo.completed_at is None:
        # Todo not completed yet - only update rating, skip FSRS
        existing_review.rating = review.rating
        await session.flush()

        # Refresh and return with relationships loaded
        await session.refresh(existing_review, ["topic", "todo"])
        return existing_review

    # Todo is completed - run FSRS recalculation
    # Use provided rating or default to "good"
    rating_value = review.rating or "good"

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
    fsrs_rating = map_rating_to_fsrs(rating_value)
    review_datetime = datetime.now(timezone.utc)
    updated_card, review_log = scheduler.review_card(
        card=card,
        rating=fsrs_rating,
        review_datetime=review_datetime
    )

    # Calculate new topic_due_after as a date
    due_after_date = updated_card.due.date()

    # Update the review with new rating and "after" state
    existing_review.rating = rating_value
    existing_review.topic_stability_after = updated_card.stability
    existing_review.topic_difficulty_after = updated_card.difficulty
    existing_review.topic_state_after = map_fsrs_state_to_db(updated_card.state)
    existing_review.topic_step_after = updated_card.step
    existing_review.topic_due_after = due_after_date

    await session.flush()

    # Replay from this review's date to recalculate subsequent reviews
    await replay_reviews_from_date(
        session=session,
        topic_id=topic.id,
        user_id=user_id,
        from_date=todo.completed_at,
    )

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
    # Fetch the review with topic and todo before deleting
    review_result = await session.execute(
        select(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .options(selectinload(Review.topic), selectinload(Review.todo))
    )
    review = review_result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    topic_id = review.topic_id
    todo_completed_at = review.todo.completed_at

    # Delete the review
    await session.delete(review)
    await session.flush()

    # Only replay if todo was completed
    if todo_completed_at is not None:
        await replay_reviews_from_date(
            session=session,
            topic_id=topic_id,
            user_id=user_id,
            from_date=todo_completed_at,
        )

    return {"message": "Review deleted successfully"}
