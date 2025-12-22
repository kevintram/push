from datetime import datetime, timezone, date, time

from fastapi import APIRouter, HTTPException
from fsrs import Card, Rating as FSRSRating, Scheduler, State as FSRSState
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.dependencies import SessionDep, UserIdDep
from app.core.config import settings
from app.models import Review, ReviewSession, Topic
from app.schemas import ReviewCreate, ReviewListItem, ReviewRead, ReviewUpdate, ReviewWithTopic

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
    starting_card: Card,
    subsequent_reviews: list[Review],
    scheduler: Scheduler,
) -> Card:
    """
    Replay a list of reviews in chronological order, updating their before/after states.

    Args:
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
        fsrs_rating = map_rating_to_fsrs(review.rating or "good")

        # Use the actual review completion date
        review_date = review.completed_at
        if isinstance(review_date, datetime):
            review_datetime = review_date
        else:
            # Convert date to datetime at midnight UTC
            review_datetime = datetime.combine(review_date, time.min).replace(
                tzinfo=timezone.utc
            )

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
        select(Review)
        .where(
            Review.topic_id == topic_id,
            Review.user_id == user_id,
            Review.completed_at.isnot(None),
            Review.completed_at >= from_date,
        )
        .order_by(Review.completed_at.asc())
        .options(selectinload(Review.review_session))
    )
    reviews_to_replay = list(reviews_result.scalars().all())
    # Find the last review BEFORE from_date to get starting FSRS state
    before_review_result = await session.execute(
        select(Review)
        .where(
            Review.topic_id == topic_id,
            Review.user_id == user_id,
            Review.completed_at.isnot(None),
            Review.completed_at < from_date,
        )
        .order_by(Review.completed_at.desc())
        .options(selectinload(Review.review_session))
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
        else:
            # No prior reviews - reset to initial state
            topic.stability = settings.FSRS_INITIAL_STABILITY
            topic.difficulty = settings.FSRS_INITIAL_DIFFICULTY
            topic.state = settings.FSRS_INITIAL_STATE
            topic.step = None

        await session.flush()
        return

    # Initialize FSRS scheduler
    scheduler = Scheduler()

    # Determine starting card state
    if last_before_review and last_before_review.stability_after is not None:
        # Start from the "after" state of the last review before from_date
        state = map_state_to_fsrs(last_before_review.state_after)

        # Get the last review date
        last_review_date = last_before_review.completed_at
        if isinstance(last_review_date, datetime):
            last_review_datetime = last_review_date
        else:
            last_review_datetime = datetime.combine(last_review_date, time.min).replace(
                tzinfo=timezone.utc
            )

        starting_card = Card(
            state=state,
            stability=last_before_review.stability_after,
            difficulty=last_before_review.difficulty_after,
            step=None if state == FSRSState.Review else last_before_review.step_after,
            last_review=last_review_datetime,
        )
    else:
        # No prior reviews or no FSRS state, start from initial state
        state = map_state_to_fsrs(settings.FSRS_INITIAL_STATE)
        starting_card = Card(
            state=state,
            stability=settings.FSRS_INITIAL_STABILITY,
            difficulty=settings.FSRS_INITIAL_DIFFICULTY,
            step=None,
            last_review=datetime.now(timezone.utc),
        )

    # Replay reviews from the determined starting state
    final_card = await replay_subsequent_reviews(
        starting_card=starting_card,
        subsequent_reviews=reviews_to_replay,
        scheduler=scheduler,
    )

    # Update topic with final state
    topic.stability = final_card.stability
    topic.difficulty = final_card.difficulty
    topic.state = map_fsrs_state_to_db(final_card.state)
    topic.step = final_card.step

    await session.flush()


@router.get("/reviews/", tags=["reviews"])
async def read_reviews(
    session: SessionDep,
    user_id: UserIdDep,
    review_session_id: int | None = None,
    topic_id: int | None = None,
    effective_date_before: str | None = None,
    effective_date_after: str | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
) -> list[ReviewListItem]:
    """Get all reviews for the user, with optional filters for review_session_id, topic_id, dates, and completion status."""
    stmt = (
        select(
            Review,
            Topic.id,
            Topic.name,
            Topic.notes,
            ReviewSession.id,
            ReviewSession.description,
        )
        .join(Topic, Review.topic_id == Topic.id)
        .outerjoin(ReviewSession, Review.review_session_id == ReviewSession.id)
        .where(Review.user_id == user_id)
        .order_by(
            Review.completed_at.asc().nulls_first(),
            Review.scheduled_at.asc(),
            Review.id.asc(),
        )
    )

    if review_session_id is not None:
        stmt = stmt.where(Review.review_session_id == review_session_id)

    if topic_id is not None:
        stmt = stmt.where(Review.topic_id == topic_id)

    if effective_date_before is not None:
        date_before = datetime.strptime(effective_date_before, '%Y-%m-%d').date()
        stmt = stmt.where(Review.effective_date <= date_before)

    if effective_date_after is not None:
        date_after = datetime.strptime(effective_date_after, '%Y-%m-%d').date()
        stmt = stmt.where(Review.effective_date >= date_after)

    if completed is not None:
        if completed:
            stmt = stmt.where(Review.completed_at.isnot(None))
        else:
            stmt = stmt.where(Review.completed_at.is_(None))

    if scheduled is not None:
        if scheduled:
            stmt = stmt.where(Review.scheduled_at.isnot(None))
        else:
            stmt = stmt.where(Review.scheduled_at.is_(None))

    result = await session.execute(stmt)
    items: list[ReviewListItem] = []
    for (
        review,
        row_topic_id,
        topic_name,
        topic_notes,
        row_review_session_id,
        review_session_description,
    ) in result.all():
        review_data = ReviewRead.model_validate(review).model_dump()
        review_data["topic"] = {
            "id": row_topic_id,
            "name": topic_name,
            "notes": topic_notes,
        }
        review_data["review_session"] = (
            {
                "id": row_review_session_id,
                "description": review_session_description,
            }
            if row_review_session_id is not None
            else None
        )
        items.append(ReviewListItem(**review_data))
    return items


@router.get("/reviews/{id}/", tags=["reviews"])
async def read_review(
    session: SessionDep,
    user_id: UserIdDep,
    id: int,
) -> ReviewWithTopic:
    """Get a specific review by id."""
    stmt = (
        select(Review)
        .where(Review.id == id, Review.user_id == user_id)
        .options(selectinload(Review.topic), selectinload(Review.review_session))
    )

    result = await session.execute(stmt)
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    return review


@router.post("/reviews/", tags=["reviews"])
async def create_review(
    review_create: ReviewCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithTopic:
    """Create a new review.

    Supports creating and linking entities in any combination:
    - Link existing topic + existing review session (provide topic_id and review_session_id)
    - Create new topic + link to existing review session (provide topic and review_session_id)
    - Link existing topic + create new review session (provide topic_id and review_session)
    - Create both new topic and review session (provide topic and review_session)
    """
    # Resolve or create Topic
    if review_create.topic_id is not None:
        # Fetch existing topic
        topic_result = await session.execute(
            select(Topic).where(
                Topic.id == review_create.topic_id, Topic.user_id == user_id
            )
        )
        topic = topic_result.scalar_one_or_none()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
    else:
        # Create new topic from inline data
        assert review_create.topic is not None
        topic = Topic(**review_create.topic.model_dump(), user_id=user_id)
        session.add(topic)
        await session.flush()

    # Resolve or create Review Session (optional - can be None)
    review_session_id: int | None = None
    if review_create.review_session_id is not None:
        # Fetch existing review session
        session_result = await session.execute(
            select(ReviewSession).where(
                ReviewSession.id == review_create.review_session_id, ReviewSession.user_id == user_id
            )
        )
        review_session = session_result.scalar_one_or_none()
        if not review_session:
            raise HTTPException(status_code=404, detail="Review Session not found")
        review_session_id = review_session.id
    elif review_create.review_session is not None:
        # Create new review session from inline data
        review_session = ReviewSession(**review_create.review_session.model_dump(), user_id=user_id)
        session.add(review_session)
        await session.flush()
        review_session_id = review_session.id
    # else: review_session_id remains None (no session)

    # Check if review is completed - only run FSRS if it is
    if review_create.completed_at is None:
        # Review not completed yet - create review without FSRS or rating
        new_review = Review(
            review_session_id=review_session_id,
            topic_id=topic.id,
            user_id=user_id,
            description=review_create.description,
            scheduled_at=review_create.scheduled_at,
            completed_at=None,
            # All FSRS fields remain None
        )
        session.add(new_review)

        try:
            await session.flush()
        except IntegrityError:
            raise HTTPException(
                status_code=409,
                detail="Review already exists",
            )

        # Re-query to get fresh data with all computed columns
        review_result = await session.execute(
            select(Review)
            .where(Review.id == new_review.id)
            .options(selectinload(Review.topic), selectinload(Review.review_session))
        )
        refreshed_review = review_result.scalar_one()
        return ReviewWithTopic.model_validate(refreshed_review)

    # Review is completed - run FSRS
    # Store topic's current state as "before" state
    stability_before = topic.stability
    difficulty_before = topic.difficulty
    state_before = topic.state
    step_before = topic.step

    # Use provided rating or default to "good"
    rating_value = review_create.rating or "good"

    # Initialize FSRS scheduler with default parameters
    scheduler = Scheduler()

    # Create a Card representing the topic's current state
    state = map_state_to_fsrs(topic.state)
    card = Card(
        state=state,
        stability=topic.stability,
        difficulty=topic.difficulty,
        step=None if state == FSRSState.Review else topic.step,
        last_review=datetime.now(timezone.utc),
    )

    # Review the card with FSRS
    fsrs_rating = map_rating_to_fsrs(rating_value)
    # Use completion date for review logic
    review_date = review_create.completed_at
    review_datetime = datetime.combine(review_date, time.min).replace(tzinfo=timezone.utc)
    
    updated_card, review_log = scheduler.review_card(
        card=card, rating=fsrs_rating, review_datetime=review_datetime
    )

    # Calculate due_after as a date (extract date from datetime)
    due_after_date = updated_card.due.date()

    # Create the review with FSRS state
    new_review = Review(
        review_session_id=review_session_id,
        topic_id=topic.id,
        user_id=user_id,
        description=review_create.description,
        scheduled_at=review_create.scheduled_at,
        completed_at=review_create.completed_at,
        rating=rating_value,
        # Topic before state
        stability_before=stability_before,
        difficulty_before=difficulty_before,
        state_before=state_before,
        step_before=step_before,
        # Topic after state
        stability_after=updated_card.stability,
        difficulty_after=updated_card.difficulty,
        state_after=map_fsrs_state_to_db(updated_card.state),
        step_after=updated_card.step,
        due_after=due_after_date,
    )
    session.add(new_review)

    try:
        await session.flush()
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Review already exists",
        )

    # Update the topic with new FSRS state
    topic.stability = updated_card.stability
    topic.difficulty = updated_card.difficulty
    topic.state = map_fsrs_state_to_db(updated_card.state)
    topic.step = updated_card.step

    # Replay all reviews that come after this newly created review
    await replay_reviews_from_date(
        session=session,
        topic_id=topic.id,
        user_id=user_id,
        from_date=review_create.completed_at,
    )

    # Re-query to get fresh data with all computed columns
    review_result = await session.execute(
        select(Review)
        .where(Review.id == new_review.id)
        .options(selectinload(Review.topic), selectinload(Review.review_session))
    )
    refreshed_review = review_result.scalar_one()
    return ReviewWithTopic.model_validate(refreshed_review)


@router.post("/reviews/{id}/", tags=["reviews"])
async def update_review(
    id: int,
    review_update: ReviewUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithTopic:
    """Update a review's rating/completion and recalculate FSRS state."""
    # Fetch the existing review
    review_result = await session.execute(
        select(Review)
        .where(Review.id == id, Review.user_id == user_id)
        .options(selectinload(Review.topic), selectinload(Review.review_session))
    )
    existing_review = review_result.scalar_one_or_none()

    if not existing_review:
        raise HTTPException(status_code=404, detail="Review not found")

    topic = existing_review.topic
    fields_set = review_update.model_fields_set

    # Update simple fields
    if "description" in fields_set and review_update.description is not None:
        existing_review.description = review_update.description
    if "notes" in fields_set and review_update.notes is not None:
        existing_review.notes = review_update.notes
    if "scheduled_at" in fields_set:
        existing_review.scheduled_at = review_update.scheduled_at
    if "review_session_id" in fields_set:
        existing_review.review_session_id = review_update.review_session_id

    # Check if review is completed - only run FSRS if it is
    # We use the new completed_at if provided, else the existing one
    new_completed_at = (
        review_update.completed_at
        if "completed_at" in fields_set
        else existing_review.completed_at
    )
    
    # If completed_at is changing, we might need to update it
    completed_at_changed = existing_review.completed_at != new_completed_at
    if completed_at_changed:
        existing_review.completed_at = new_completed_at

    if new_completed_at is None:
        # Review not completed yet - only update rating/desc, skip FSRS
        if "rating" in fields_set:
            existing_review.rating = review_update.rating

        await session.flush()

        # Re-query to get fresh data with all computed columns
        review_result = await session.execute(
            select(Review)
            .where(Review.id == id)
            .options(selectinload(Review.topic), selectinload(Review.review_session))
        )
        refreshed_review = review_result.scalar_one()
        return ReviewWithTopic.model_validate(refreshed_review)

    # Review is completed - run FSRS recalculation
    # Use provided rating or default to "good" or existing rating
    rating_value = review_update.rating or existing_review.rating or "good"

    # Initialize FSRS scheduler with default parameters
    scheduler = Scheduler()

    # Create a Card from the review's "before" state
    state = (
        map_state_to_fsrs(existing_review.state_before)
        if existing_review.state_before
        else FSRSState.Learning
    )
    card = Card(
        state=state,
        stability=existing_review.stability_before,
        difficulty=existing_review.difficulty_before,
        step=None if state == FSRSState.Review else existing_review.step_before,
    )

    # Review the card with the NEW rating
    fsrs_rating = map_rating_to_fsrs(rating_value)
    
    review_date = new_completed_at
    review_datetime = datetime.combine(review_date, time.min).replace(tzinfo=timezone.utc)
    
    updated_card, review_log = scheduler.review_card(
        card=card, rating=fsrs_rating, review_datetime=review_datetime
    )

    # Calculate new due_after as a date
    due_after_date = updated_card.due.date()

    # Update the review with new rating and "after" state
    existing_review.rating = rating_value
    existing_review.stability_after = updated_card.stability
    existing_review.difficulty_after = updated_card.difficulty
    existing_review.state_after = map_fsrs_state_to_db(updated_card.state)
    existing_review.step_after = updated_card.step
    existing_review.due_after = due_after_date

    await session.flush()

    # Replay from this review's date to recalculate subsequent reviews
    await replay_reviews_from_date(
        session=session,
        topic_id=topic.id,
        user_id=user_id,
        from_date=new_completed_at,
    )

    # Re-query to get fresh data with all computed columns
    review_result = await session.execute(
        select(Review)
        .where(Review.id == id)
        .options(selectinload(Review.topic), selectinload(Review.review_session))
    )
    refreshed_review = review_result.scalar_one()
    return ReviewWithTopic.model_validate(refreshed_review)


@router.delete("/reviews/{id}/", tags=["reviews"])
async def delete_review(
    id: int,
    session: SessionDep,
    user_id: UserIdDep,
):
    """Delete a review and restore topic to its before state."""
    # Fetch the review with topic and review before deleting
    review_result = await session.execute(
        select(Review)
        .where(Review.id == id, Review.user_id == user_id)
        .options(selectinload(Review.topic), selectinload(Review.review_session))
    )
    review = review_result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    topic_id = review.topic_id
    completed_at = review.completed_at

    # Delete the review
    await session.delete(review)
    await session.flush()

    # Only replay if review was completed
    if completed_at is not None:
        await replay_reviews_from_date(
            session=session,
            topic_id=topic_id,
            user_id=user_id,
            from_date=completed_at,
        )

    return {"message": "Review deleted successfully"}
