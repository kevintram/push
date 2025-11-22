from datetime import datetime, timezone, date

from fastapi import APIRouter, HTTPException
from fsrs import Card, Rating as FSRSRating, Scheduler, State as FSRSState
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.dependencies import SessionDep, UserIdDep
from app.models import TopicReview, Review, Topic
from app.schemas import TopicReviewCreate, TopicReviewUpdate, TopicReviewWithTopic

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
    subsequent_reviews: list[TopicReview],
    scheduler: Scheduler,
) -> Card:
    """
    Replay a list of reviews in chronological order, updating their before/after states.

    Args:
        topic: The topic being reviewed
        starting_card: The card state to start replaying from
        subsequent_reviews: List of reviews to replay, ordered by review.completed_at ASC
        scheduler: FSRS scheduler instance

    Returns:
        The final card state after all reviews have been replayed
    """
    current_card = starting_card

    for review in subsequent_reviews:
        # Update this review's "before" state to match current card state
        review.stability_before = current_card.stability
        review.difficulty_before = current_card.difficulty
        review.state_before = map_fsrs_state_to_db(current_card.state)
        review.step_before = current_card.step
        review.due_before = (
            current_card.due.date()
            if hasattr(current_card.due, "date")
            else current_card.due
        )

        # Review the card with this review's rating
        fsrs_rating = map_rating_to_fsrs(review.rating)
        review_datetime = datetime.now(timezone.utc)
        updated_card, review_log = scheduler.review_card(
            card=current_card, rating=fsrs_rating, review_datetime=review_datetime
        )

        # Update this review's "after" state with the new calculation
        review.stability_after = updated_card.stability
        review.difficulty_after = updated_card.difficulty
        review.state_after = map_fsrs_state_to_db(updated_card.state)
        review.step_after = updated_card.step
        review.due_after = updated_card.due.date()

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

    Only replays reviews where review.completed_at >= from_date.
    More efficient than replaying all reviews when only later reviews are affected.

    Args:
        session: Database session
        topic_id: ID of the topic to replay
        user_id: User ID for authorization
        from_date: Only replay reviews with review.completed_at >= from_date
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
        select(TopicReview)
        .join(Review, TopicReview.review_id == Review.id)
        .where(
            TopicReview.topic_id == topic_id,
            TopicReview.user_id == user_id,
            Review.completed_at.isnot(None),
            Review.completed_at >= from_date,
        )
        .order_by(Review.completed_at.asc())
        .options(selectinload(TopicReview.review))
    )
    reviews_to_replay = list(reviews_result.scalars().all())
    # Find the last review BEFORE from_date to get starting FSRS state
    before_review_result = await session.execute(
        select(TopicReview)
        .join(Review, TopicReview.review_id == Review.id)
        .where(
            TopicReview.topic_id == topic_id,
            TopicReview.user_id == user_id,
            Review.completed_at.isnot(None),
            Review.completed_at < from_date,
        )
        .order_by(Review.completed_at.desc())
        .limit(1)
    )
    last_before_review = before_review_result.scalar_one_or_none()

    if not reviews_to_replay:
        # No reviews to replay - reset topic to the state before from_date
        if last_before_review and last_before_review.stability_after is not None:
            # Set topic to the "after" state of the last review before from_date
            topic.stability = last_before_review.stability_after
            topic.difficulty = last_before_review.difficulty_after
            topic.state = last_before_review.state_after
            topic.step = last_before_review.step_after
            topic.due = last_before_review.due_after
        else:
            # No prior reviews - reset to initial state
            topic.stability = None
            topic.difficulty = None
            topic.state = "LEARNING"
            topic.step = None
            topic.due = None

        await session.flush()
        return

    # Initialize FSRS scheduler
    scheduler = Scheduler()

    # Determine starting card state
    if last_before_review and last_before_review.stability_after is not None:
        # Start from the "after" state of the last review before from_date
        starting_card = Card(
            state=map_state_to_fsrs(last_before_review.state_after),
            stability=last_before_review.stability_after,
            difficulty=last_before_review.difficulty_after,
            step=last_before_review.step_after,
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


@router.get("/topic-reviews/", tags=["topic-reviews"])
async def read_topic_reviews(
    session: SessionDep,
    user_id: UserIdDep,
    review_id: int | None = None,
    topic_id: int | None = None,
) -> list[TopicReviewWithTopic]:
    """Get all topic reviews for the user, with optional filters for review_id and topic_id."""
    stmt = (
        select(TopicReview)
        .where(TopicReview.user_id == user_id)
        .options(selectinload(TopicReview.topic), selectinload(TopicReview.review))
    )

    if review_id is not None:
        stmt = stmt.where(TopicReview.review_id == review_id)

    if topic_id is not None:
        stmt = stmt.where(TopicReview.topic_id == topic_id)

    stmt = stmt.order_by(TopicReview.updated_at.desc())

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/topic-reviews/{id}/", tags=["topic-reviews"])
async def read_topic_review(
    session: SessionDep,
    user_id: UserIdDep,
    id: int,
) -> TopicReviewWithTopic:
    """Get a specific topic review by id."""
    stmt = (
        select(TopicReview)
        .where(TopicReview.id == id, TopicReview.user_id == user_id)
        .options(selectinload(TopicReview.topic), selectinload(TopicReview.review))
    )

    result = await session.execute(stmt)
    topic_review = result.scalar_one_or_none()

    if not topic_review:
        raise HTTPException(status_code=404, detail="Topic Review not found")

    return topic_review


@router.post("/topic-reviews/", tags=["topic-reviews"])
async def create_topic_review(
    topic_review: TopicReviewCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReviewWithTopic:
    """Create a new topic review."""
    # Verify review exists and belongs to user
    review_result = await session.execute(
        select(Review).where(
            Review.id == topic_review.review_id, Review.user_id == user_id
        )
    )
    review = review_result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Verify topic exists and belongs to user
    topic_result = await session.execute(
        select(Topic).where(Topic.id == topic_review.topic_id, Topic.user_id == user_id)
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Check if review is completed - only run FSRS if it is
    if review.completed_at is None:
        # Review not completed yet - create topic review without FSRS or rating
        new_topic_review = TopicReview(
            review_id=topic_review.review_id,
            topic_id=topic_review.topic_id,
            user_id=user_id,
            # All FSRS fields remain None
        )
        session.add(new_topic_review)

        try:
            await session.flush()
        except IntegrityError:
            raise HTTPException(
                status_code=409,
                detail="Topic Review already exists for this review-topic pair",
            )

        # Refresh with topic relationship loaded
        await session.refresh(new_topic_review, ["topic", "review"])
        return new_topic_review

    # Review is completed - run FSRS
    # Store topic's current state as "before" state
    stability_before = topic.stability
    difficulty_before = topic.difficulty
    state_before = topic.state
    step_before = topic.step
    due_before = topic.due

    # Use provided rating or default to "good"
    rating_value = topic_review.rating or "good"

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
        card=card, rating=fsrs_rating, review_datetime=review_datetime
    )

    # Calculate due_after as a date (extract date from datetime)
    due_after_date = updated_card.due.date()

    # Create the topic review with FSRS state
    new_topic_review = TopicReview(
        review_id=topic_review.review_id,
        topic_id=topic_review.topic_id,
        user_id=user_id,
        rating=rating_value,
        # Topic before state
        stability_before=stability_before,
        difficulty_before=difficulty_before,
        state_before=state_before,
        step_before=step_before,
        due_before=due_before,
        # Topic after state
        stability_after=updated_card.stability,
        difficulty_after=updated_card.difficulty,
        state_after=map_fsrs_state_to_db(updated_card.state),
        step_after=updated_card.step,
        due_after=due_after_date,
    )
    session.add(new_topic_review)

    try:
        await session.flush()
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Topic Review already exists for this review-topic pair",
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
        from_date=review.completed_at,
    )

    # Refresh with topic relationship loaded
    await session.refresh(new_topic_review, ["topic", "review"])
    return new_topic_review


@router.post("/topic-reviews/{id}/", tags=["topic-reviews"])
async def update_topic_review(
    id: int,
    topic_review: TopicReviewUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReviewWithTopic:
    """Update a topic review's rating and recalculate FSRS state."""
    # Fetch the existing topic review with review and topic
    review_result = await session.execute(
        select(TopicReview)
        .where(TopicReview.id == id, TopicReview.user_id == user_id)
        .options(selectinload(TopicReview.topic), selectinload(TopicReview.review))
    )
    existing_topic_review = review_result.scalar_one_or_none()

    if not existing_topic_review:
        raise HTTPException(status_code=404, detail="Topic Review not found")

    topic = existing_topic_review.topic
    review = existing_topic_review.review

    # Check if review is completed - only run FSRS if it is
    if review.completed_at is None:
        # Review not completed yet - only update rating, skip FSRS
        existing_topic_review.rating = topic_review.rating
        await session.flush()

        # Refresh and return with relationships loaded
        await session.refresh(existing_topic_review, ["topic", "review"])
        return existing_topic_review

    # Review is completed - run FSRS recalculation
    # Use provided rating or default to "good"
    rating_value = topic_review.rating or "good"

    # Initialize FSRS scheduler with default parameters
    scheduler = Scheduler()

    # Create a Card from the topic review's "before" state
    # This represents the topic state BEFORE this review was originally made
    card = Card(
        state=map_state_to_fsrs(existing_topic_review.state_before)
        if existing_topic_review.state_before
        else FSRSState.Learning,
        stability=existing_topic_review.stability_before,
        difficulty=existing_topic_review.difficulty_before,
        step=existing_topic_review.step_before,
    )

    # Review the card with the NEW rating
    fsrs_rating = map_rating_to_fsrs(rating_value)
    review_datetime = datetime.now(timezone.utc)
    updated_card, review_log = scheduler.review_card(
        card=card, rating=fsrs_rating, review_datetime=review_datetime
    )

    # Calculate new due_after as a date
    due_after_date = updated_card.due.date()

    # Update the topic review with new rating and "after" state
    existing_topic_review.rating = rating_value
    existing_topic_review.stability_after = updated_card.stability
    existing_topic_review.difficulty_after = updated_card.difficulty
    existing_topic_review.state_after = map_fsrs_state_to_db(updated_card.state)
    existing_topic_review.step_after = updated_card.step
    existing_topic_review.due_after = due_after_date

    await session.flush()

    # Replay from this review's date to recalculate subsequent reviews
    await replay_reviews_from_date(
        session=session,
        topic_id=topic.id,
        user_id=user_id,
        from_date=review.completed_at,
    )

    # Refresh and return with relationships loaded
    await session.refresh(existing_topic_review, ["topic", "review"])
    return existing_topic_review


@router.delete("/topic-reviews/{id}/", tags=["topic-reviews"])
async def delete_topic_review(
    id: int,
    session: SessionDep,
    user_id: UserIdDep,
):
    """Delete a topic review and restore topic to its before state."""
    # Fetch the review with topic and review before deleting
    review_result = await session.execute(
        select(TopicReview)
        .where(TopicReview.id == id, TopicReview.user_id == user_id)
        .options(selectinload(TopicReview.topic), selectinload(TopicReview.review))
    )
    topic_review = review_result.scalar_one_or_none()

    if not topic_review:
        raise HTTPException(status_code=404, detail="Topic Review not found")

    topic_id = topic_review.topic_id
    review_completed_at = topic_review.review.completed_at

    # Delete the topic review
    await session.delete(topic_review)
    await session.flush()

    # Only replay if review was completed
    if review_completed_at is not None:
        await replay_reviews_from_date(
            session=session,
            topic_id=topic_id,
            user_id=user_id,
            from_date=review_completed_at,
        )

    return {"message": "Topic Review deleted successfully"}
