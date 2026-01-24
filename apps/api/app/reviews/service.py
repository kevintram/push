"""Review business logic, data access, and FSRS logic.

FSRS helper functions are kept here (not in a separate module) because they're
tightly coupled with database operations in replay functions.
"""

from datetime import date, datetime, time, timezone

from fsrs import Card, Rating as FSRSRating, Scheduler, State as FSRSState
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import AlreadyExistsError, NotFoundError
from app.models import FsrsState, Review, ReviewSession, Source, Topic
from app.models.sources import t_source_reviews


# --- FSRS Helpers (pure functions, kept here for locality) ---


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


def replay_reviews(
    fsrs_state: FsrsState,
    reviews_to_replay: list[Review],
    last_before_review: Review | None,
) -> None:
    """
    Replay reviews and update FSRS state.

    Args:
        fsrs_state: The FsrsState to update (mutated in place)
        reviews_to_replay: Reviews in chronological order by completed_at (mutated with before/after states)
        last_before_review: Last completed review before the replay window, or None
    """
    if not reviews_to_replay:
        # Reset to last_before_review's after-state, or inherited state
        if last_before_review and last_before_review.stability_after is not None:
            fsrs_state.stability = last_before_review.stability_after
            fsrs_state.difficulty = last_before_review.difficulty_after
            fsrs_state.state = last_before_review.state_after
            fsrs_state.step = last_before_review.step_after
        else:
            fsrs_state.stability = fsrs_state.inherited_stability
            fsrs_state.difficulty = fsrs_state.inherited_difficulty
            fsrs_state.state = fsrs_state.inherited_state or "LEARNING"
            inherited_state = fsrs_state.inherited_state or "LEARNING"
            fsrs_state.step = (
                None if inherited_state == "REVIEW" else fsrs_state.inherited_step
            )
        return

    # Determine starting card from last_before_review or inherited state
    if last_before_review and last_before_review.stability_after is not None:
        state = map_state_to_fsrs(last_before_review.state_after)
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
        inherited_state_str = fsrs_state.inherited_state or "LEARNING"
        state = map_state_to_fsrs(inherited_state_str)
        inherited_last_review_dt = (
            datetime.combine(fsrs_state.inherited_last_review, time.min).replace(
                tzinfo=timezone.utc
            )
            if fsrs_state.inherited_last_review is not None
            else None
        )
        starting_card = Card(
            state=state,
            stability=fsrs_state.inherited_stability,
            difficulty=fsrs_state.inherited_difficulty,
            step=None if state == FSRSState.Review else fsrs_state.inherited_step,
            last_review=inherited_last_review_dt,
        )

    # Replay each review
    scheduler = Scheduler()
    current_card = starting_card
    for review in reviews_to_replay:
        # Set review's before-state from current_card
        review.stability_before = current_card.stability
        review.difficulty_before = current_card.difficulty
        review.state_before = map_fsrs_state_to_db(current_card.state)
        review.step_before = current_card.step
        review.due_before = (
            current_card.due.date()
            if hasattr(current_card.due, "date")
            else current_card.due
        )

        # Run FSRS
        fsrs_rating = map_rating_to_fsrs(review.rating or "good")
        review_date = review.completed_at
        if isinstance(review_date, datetime):
            review_datetime = review_date
        else:
            review_datetime = datetime.combine(review_date, time.min).replace(
                tzinfo=timezone.utc
            )

        updated_card, _ = scheduler.review_card(
            card=current_card, rating=fsrs_rating, review_datetime=review_datetime
        )

        # Set review's after-state
        review.stability_after = updated_card.stability
        review.difficulty_after = updated_card.difficulty
        review.state_after = map_fsrs_state_to_db(updated_card.state)
        review.step_after = updated_card.step
        review.due_after = updated_card.due.date()

        current_card = updated_card

    # Update fsrs_state with final card
    fsrs_state.stability = current_card.stability
    fsrs_state.difficulty = current_card.difficulty
    fsrs_state.state = map_fsrs_state_to_db(current_card.state)
    fsrs_state.step = current_card.step


# --- Review Operations ---


async def get_review(session: AsyncSession, review_id: int, user_id: str) -> Review:
    """Get a review or raise NotFoundError."""
    stmt = (
        select(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .options(
            selectinload(Review.topic),
            selectinload(Review.source),
            selectinload(Review.review_session),
        )
    )
    result = await session.execute(stmt)
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundError("Review", review_id)
    return review


async def list_reviews(
    session: AsyncSession,
    user_id: str,
    *,
    review_session_id: int | None = None,
    topic_id: int | None = None,
    source_id: int | None = None,
    effective_date_before: date | None = None,
    effective_date_after: date | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
) -> list[tuple]:
    """List reviews with optional filters. Returns raw query results for router to process."""
    stmt = (
        select(
            Review,
            Topic.id,
            Topic.name,
            Topic.notes,
            Source.id,
            Source.title,
            Source.notes,
            ReviewSession.id,
            ReviewSession.description,
        )
        .outerjoin(Topic, Review.topic_id == Topic.id)
        .outerjoin(t_source_reviews, Review.id == t_source_reviews.c.review_id)
        .outerjoin(Source, t_source_reviews.c.source_id == Source.id)
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

    if source_id is not None:
        stmt = stmt.where(t_source_reviews.c.source_id == source_id)

    if effective_date_before is not None:
        stmt = stmt.where(Review.effective_date <= effective_date_before)

    if effective_date_after is not None:
        stmt = stmt.where(Review.effective_date >= effective_date_after)

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
    return result.all()


async def create_review(
    session: AsyncSession,
    user_id: str,
    *,
    topic_id: int | None = None,
    topic_data: dict | None = None,
    source_id: int | None = None,
    source_data: dict | None = None,
    review_session_id: int | None = None,
    review_session_data: dict | None = None,
    description: str | None = None,
    scheduled_at: date | None = None,
    completed_at: date | None = None,
    rating: str | None = None,
) -> Review:
    """Create a new review for a topic or source.

    Supports creating and linking entities in any combination:
    - For topic reviews: provide topic_id or topic_data (inline creation)
    - For source reviews: provide source_id or source_data (inline creation)
    - Optionally link to a review session via review_session_id or review_session_data

    Raises AlreadyExistsError if review already exists.
    """
    # Determine if this is a topic or source review
    is_topic_review = topic_id is not None or topic_data is not None
    is_source_review = source_id is not None or source_data is not None

    # Resolve or create the target entity (Topic or Source)
    topic: Topic | None = None
    source: Source | None = None
    entity_for_fsrs: Topic | Source  # The entity whose FSRS state we'll use

    if is_topic_review:
        if topic_id is not None:
            topic_result = await session.execute(
                select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
            )
            topic = topic_result.scalar_one_or_none()
            if not topic:
                raise NotFoundError("Topic", topic_id)
        else:
            assert topic_data is not None
            topic = Topic(
                name=topic_data["name"],
                notes=topic_data.get("notes", ""),
                user_id=user_id,
            )

            if topic_data.get("srs_enabled"):
                fsrs_state = FsrsState(srs_enabled=True)
                session.add(fsrs_state)
                await session.flush()
                topic.fsrs_state_id = fsrs_state.id

            session.add(topic)
            await session.flush()
        entity_for_fsrs = topic
    else:
        if source_id is not None:
            source_result = await session.execute(
                select(Source).where(Source.id == source_id, Source.user_id == user_id)
            )
            source = source_result.scalar_one_or_none()
            if not source:
                raise NotFoundError("Source", source_id)
        else:
            assert source_data is not None
            source = Source(
                title=source_data["title"],
                notes=source_data.get("notes", ""),
                user_id=user_id,
            )

            if source_data.get("srs_enabled"):
                fsrs_state = FsrsState(srs_enabled=True)
                session.add(fsrs_state)
                await session.flush()
                source.fsrs_state_id = fsrs_state.id

            session.add(source)
            await session.flush()
        entity_for_fsrs = source

    # Resolve or create Review Session (optional - can be None)
    resolved_review_session_id: int | None = None
    if review_session_id is not None:
        session_result = await session.execute(
            select(ReviewSession).where(
                ReviewSession.id == review_session_id,
                ReviewSession.user_id == user_id,
            )
        )
        review_session = session_result.scalar_one_or_none()
        if not review_session:
            raise NotFoundError("Review Session", review_session_id)
        resolved_review_session_id = review_session.id
    elif review_session_data is not None:
        review_session = ReviewSession(
            description=review_session_data.get("description"),
            notes=review_session_data.get("notes"),
            scheduled_at=review_session_data.get("scheduled_at"),
            completed_at=review_session_data.get("completed_at"),
            user_id=user_id,
        )
        session.add(review_session)
        await session.flush()
        resolved_review_session_id = review_session.id

    # Check if review is completed - only run FSRS if it is
    if completed_at is None:
        # Review not completed yet - create review without FSRS or rating
        new_review = Review(
            review_session_id=resolved_review_session_id,
            topic_id=topic.id if topic else None,
            user_id=user_id,
            description=description,
            scheduled_at=scheduled_at,
            completed_at=None,
        )
        session.add(new_review)

        try:
            await session.flush()
        except IntegrityError:
            raise AlreadyExistsError("Review already exists")

        # For source reviews, create the source_reviews association
        if is_source_review and source:
            await session.execute(
                t_source_reviews.insert().values(
                    review_id=new_review.id, source_id=source.id
                )
            )
            await session.flush()

        # Re-query to get fresh data
        review_result = await session.execute(
            select(Review)
            .where(Review.id == new_review.id)
            .options(
                selectinload(Review.topic),
                selectinload(Review.source),
                selectinload(Review.review_session),
            )
        )
        return review_result.scalar_one()

    # Review is completed - run FSRS
    # Store entity's current state as "before" state
    stability_before = entity_for_fsrs.stability
    difficulty_before = entity_for_fsrs.difficulty
    state_before = entity_for_fsrs.state
    step_before = entity_for_fsrs.step

    # Use provided rating or default to "good"
    rating_value = rating or "good"

    # Initialize FSRS scheduler
    scheduler = Scheduler()

    # Create a Card representing the entity's current state
    state = map_state_to_fsrs(entity_for_fsrs.state)
    last_review_dt = (
        datetime.combine(entity_for_fsrs.last_reviewed_at, time.min).replace(
            tzinfo=timezone.utc
        )
        if entity_for_fsrs.last_reviewed_at is not None
        else (
            datetime.combine(entity_for_fsrs.inherited_last_review, time.min).replace(
                tzinfo=timezone.utc
            )
            if entity_for_fsrs.inherited_last_review is not None
            else None
        )
    )
    card = Card(
        state=state,
        stability=entity_for_fsrs.stability,
        difficulty=entity_for_fsrs.difficulty,
        step=None if state == FSRSState.Review else entity_for_fsrs.step,
        last_review=last_review_dt,
    )

    # Review the card with FSRS
    fsrs_rating = map_rating_to_fsrs(rating_value)
    review_datetime = datetime.combine(completed_at, time.min).replace(
        tzinfo=timezone.utc
    )

    updated_card, review_log = scheduler.review_card(
        card=card, rating=fsrs_rating, review_datetime=review_datetime
    )

    # Calculate due_after as a date
    due_after_date = updated_card.due.date()

    # Create the review with FSRS state
    new_review = Review(
        review_session_id=resolved_review_session_id,
        topic_id=topic.id if topic else None,
        user_id=user_id,
        description=description,
        scheduled_at=scheduled_at,
        completed_at=completed_at,
        rating=rating_value,
        stability_before=stability_before,
        difficulty_before=difficulty_before,
        state_before=state_before,
        step_before=step_before,
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
        raise AlreadyExistsError("Review already exists")

    # For source reviews, create the source_reviews association
    if is_source_review and source:
        await session.execute(
            t_source_reviews.insert().values(
                review_id=new_review.id, source_id=source.id
            )
        )
        await session.flush()

    # Update the entity's fsrs_state with new FSRS state
    if entity_for_fsrs.fsrs_state is None:
        fsrs_state = FsrsState(srs_enabled=True)
        session.add(fsrs_state)
        await session.flush()
        entity_for_fsrs.fsrs_state_id = fsrs_state.id
        entity_for_fsrs.fsrs_state = fsrs_state

    entity_for_fsrs.fsrs_state.stability = updated_card.stability
    entity_for_fsrs.fsrs_state.difficulty = updated_card.difficulty
    entity_for_fsrs.fsrs_state.state = map_fsrs_state_to_db(updated_card.state)
    entity_for_fsrs.fsrs_state.step = updated_card.step
    entity_for_fsrs.fsrs_state.last_reviewed_at = (
        completed_at.date() if isinstance(completed_at, datetime) else completed_at
    )

    # Replay all reviews that come after this newly created review
    if is_topic_review and topic:
        # Fetch completed reviews from completed_at onward
        reviews_result = await session.execute(
            select(Review)
            .where(
                Review.topic_id == topic.id,
                Review.user_id == user_id,
                Review.completed_at.isnot(None),
                Review.completed_at >= completed_at,
            )
            .order_by(Review.completed_at.asc())
        )
        reviews_to_replay = list(reviews_result.scalars().all())

        # Find the last review BEFORE completed_at
        before_review_result = await session.execute(
            select(Review)
            .where(
                Review.topic_id == topic.id,
                Review.user_id == user_id,
                Review.completed_at.isnot(None),
                Review.completed_at < completed_at,
            )
            .order_by(Review.completed_at.desc())
            .limit(1)
        )
        last_before_review = before_review_result.scalar_one_or_none()

        if entity_for_fsrs.fsrs_state is not None:
            replay_reviews(
                entity_for_fsrs.fsrs_state, reviews_to_replay, last_before_review
            )
            await session.flush()
    elif is_source_review and source:
        # Fetch completed reviews from completed_at onward (via source_reviews)
        reviews_result = await session.execute(
            select(Review)
            .join(t_source_reviews, Review.id == t_source_reviews.c.review_id)
            .where(
                t_source_reviews.c.source_id == source.id,
                Review.user_id == user_id,
                Review.completed_at.isnot(None),
                Review.completed_at >= completed_at,
            )
            .order_by(Review.completed_at.asc())
        )
        reviews_to_replay = list(reviews_result.scalars().all())

        # Find the last review BEFORE completed_at
        before_review_result = await session.execute(
            select(Review)
            .join(t_source_reviews, Review.id == t_source_reviews.c.review_id)
            .where(
                t_source_reviews.c.source_id == source.id,
                Review.user_id == user_id,
                Review.completed_at.isnot(None),
                Review.completed_at < completed_at,
            )
            .order_by(Review.completed_at.desc())
            .limit(1)
        )
        last_before_review = before_review_result.scalar_one_or_none()

        if entity_for_fsrs.fsrs_state is not None:
            replay_reviews(
                entity_for_fsrs.fsrs_state, reviews_to_replay, last_before_review
            )
            await session.flush()

    # Re-query to get fresh data
    review_result = await session.execute(
        select(Review)
        .where(Review.id == new_review.id)
        .options(
            selectinload(Review.topic),
            selectinload(Review.source),
            selectinload(Review.review_session),
        )
    )
    return review_result.scalar_one()


async def update_review(
    session: AsyncSession,
    review_id: int,
    user_id: str,
    *,
    description: str | None = None,
    notes: str | None = None,
    scheduled_at: date | None = ...,  # Use ... as sentinel
    completed_at: date | None = ...,  # Use ... as sentinel
    rating: str | None = None,
    review_session_id: int | None = ...,  # Use ... as sentinel
    fields_set: set[str],
) -> Review:
    """Update a review's rating/completion and recalculate FSRS state.

    Uses PATCH semantics - only updates fields in fields_set.
    """
    # Fetch the existing review with both topic and source relationships
    existing_review = await get_review(session, review_id, user_id)

    # Determine if this is a topic or source review
    is_source_review = existing_review.source is not None
    topic = existing_review.topic
    source = existing_review.source

    # Update simple fields
    if "description" in fields_set and description is not None:
        existing_review.description = description
    if "notes" in fields_set and notes is not None:
        existing_review.notes = notes
    if "scheduled_at" in fields_set:
        existing_review.scheduled_at = scheduled_at
    if "review_session_id" in fields_set:
        existing_review.review_session_id = review_session_id

    # Check if review is completed - only run FSRS if it is
    new_completed_at = (
        completed_at if "completed_at" in fields_set else existing_review.completed_at
    )

    completed_at_changed = existing_review.completed_at != new_completed_at
    if completed_at_changed:
        existing_review.completed_at = new_completed_at

    if new_completed_at is None:
        # Review not completed yet - only update rating/desc, skip FSRS
        if "rating" in fields_set:
            existing_review.rating = rating

        await session.flush()

        review_result = await session.execute(
            select(Review)
            .where(Review.id == review_id)
            .options(
                selectinload(Review.topic),
                selectinload(Review.source),
                selectinload(Review.review_session),
            )
        )
        return review_result.scalar_one()

    # Review is completed - run FSRS recalculation
    rating_value = rating or existing_review.rating or "good"

    scheduler = Scheduler()

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

    fsrs_rating = map_rating_to_fsrs(rating_value)
    review_datetime = datetime.combine(new_completed_at, time.min).replace(
        tzinfo=timezone.utc
    )

    updated_card, review_log = scheduler.review_card(
        card=card, rating=fsrs_rating, review_datetime=review_datetime
    )

    due_after_date = updated_card.due.date()

    existing_review.rating = rating_value
    existing_review.stability_after = updated_card.stability
    existing_review.difficulty_after = updated_card.difficulty
    existing_review.state_after = map_fsrs_state_to_db(updated_card.state)
    existing_review.step_after = updated_card.step
    existing_review.due_after = due_after_date

    await session.flush()

    # Replay from this review's date to recalculate subsequent reviews
    if is_source_review and source:
        # Fetch completed reviews from new_completed_at onward (via source_reviews)
        reviews_result = await session.execute(
            select(Review)
            .join(t_source_reviews, Review.id == t_source_reviews.c.review_id)
            .where(
                t_source_reviews.c.source_id == source.id,
                Review.user_id == user_id,
                Review.completed_at.isnot(None),
                Review.completed_at >= new_completed_at,
            )
            .order_by(Review.completed_at.asc())
        )
        reviews_to_replay = list(reviews_result.scalars().all())

        # Find the last review BEFORE new_completed_at
        before_review_result = await session.execute(
            select(Review)
            .join(t_source_reviews, Review.id == t_source_reviews.c.review_id)
            .where(
                t_source_reviews.c.source_id == source.id,
                Review.user_id == user_id,
                Review.completed_at.isnot(None),
                Review.completed_at < new_completed_at,
            )
            .order_by(Review.completed_at.desc())
            .limit(1)
        )
        last_before_review = before_review_result.scalar_one_or_none()

        if source.fsrs_state is not None:
            replay_reviews(source.fsrs_state, reviews_to_replay, last_before_review)
            await session.flush()
    elif topic:
        # Fetch completed reviews from new_completed_at onward
        reviews_result = await session.execute(
            select(Review)
            .where(
                Review.topic_id == topic.id,
                Review.user_id == user_id,
                Review.completed_at.isnot(None),
                Review.completed_at >= new_completed_at,
            )
            .order_by(Review.completed_at.asc())
        )
        reviews_to_replay = list(reviews_result.scalars().all())

        # Find the last review BEFORE new_completed_at
        before_review_result = await session.execute(
            select(Review)
            .where(
                Review.topic_id == topic.id,
                Review.user_id == user_id,
                Review.completed_at.isnot(None),
                Review.completed_at < new_completed_at,
            )
            .order_by(Review.completed_at.desc())
            .limit(1)
        )
        last_before_review = before_review_result.scalar_one_or_none()

        if topic.fsrs_state is not None:
            replay_reviews(topic.fsrs_state, reviews_to_replay, last_before_review)
            await session.flush()

    review_result = await session.execute(
        select(Review)
        .where(Review.id == review_id)
        .options(
            selectinload(Review.topic),
            selectinload(Review.source),
            selectinload(Review.review_session),
        )
    )
    return review_result.scalar_one()


async def delete_review(
    session: AsyncSession,
    review_id: int,
    user_id: str,
) -> None:
    """Delete a review and restore entity (topic or source) to its before state."""
    # Fetch the review with both topic and source relationships
    review = await get_review(session, review_id, user_id)

    # Capture entity and info before deletion
    topic = review.topic
    source = review.source
    completed_at = review.completed_at

    # Delete the review (cascade will handle source_reviews association)
    await session.delete(review)
    await session.flush()

    # Only replay if review was completed
    if completed_at is not None:
        if source is not None:
            # Fetch completed reviews from completed_at onward (via source_reviews)
            reviews_result = await session.execute(
                select(Review)
                .join(t_source_reviews, Review.id == t_source_reviews.c.review_id)
                .where(
                    t_source_reviews.c.source_id == source.id,
                    Review.user_id == user_id,
                    Review.completed_at.isnot(None),
                    Review.completed_at >= completed_at,
                )
                .order_by(Review.completed_at.asc())
            )
            reviews_to_replay = list(reviews_result.scalars().all())

            # Find the last review BEFORE completed_at
            before_review_result = await session.execute(
                select(Review)
                .join(t_source_reviews, Review.id == t_source_reviews.c.review_id)
                .where(
                    t_source_reviews.c.source_id == source.id,
                    Review.user_id == user_id,
                    Review.completed_at.isnot(None),
                    Review.completed_at < completed_at,
                )
                .order_by(Review.completed_at.desc())
                .limit(1)
            )
            last_before_review = before_review_result.scalar_one_or_none()

            if source.fsrs_state is not None:
                replay_reviews(source.fsrs_state, reviews_to_replay, last_before_review)
                await session.flush()
        elif topic is not None:
            # Fetch completed reviews from completed_at onward
            reviews_result = await session.execute(
                select(Review)
                .where(
                    Review.topic_id == topic.id,
                    Review.user_id == user_id,
                    Review.completed_at.isnot(None),
                    Review.completed_at >= completed_at,
                )
                .order_by(Review.completed_at.asc())
            )
            reviews_to_replay = list(reviews_result.scalars().all())

            # Find the last review BEFORE completed_at
            before_review_result = await session.execute(
                select(Review)
                .where(
                    Review.topic_id == topic.id,
                    Review.user_id == user_id,
                    Review.completed_at.isnot(None),
                    Review.completed_at < completed_at,
                )
                .order_by(Review.completed_at.desc())
                .limit(1)
            )
            last_before_review = before_review_result.scalar_one_or_none()

            if topic.fsrs_state is not None:
                replay_reviews(topic.fsrs_state, reviews_to_replay, last_before_review)
                await session.flush()
