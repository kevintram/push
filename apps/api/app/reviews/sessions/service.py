"""Review session business logic."""

from datetime import date

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import BadRequestError, NotFoundError
from app.models import Review, ReviewSession, Topic
from app.reviews.service import replay_topic_reviews_from_date


async def get_review_session(
    session: AsyncSession, session_id: int, user_id: str
) -> ReviewSession:
    """Get a review session or raise NotFoundError."""
    stmt = (
        select(ReviewSession)
        .where(ReviewSession.id == session_id, ReviewSession.user_id == user_id)
        .options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    )
    result = await session.execute(stmt)
    review_session = result.scalar_one_or_none()
    if not review_session:
        raise NotFoundError("Review Session", session_id)
    return review_session


async def list_recent_review_sessions(
    session: AsyncSession,
    user_id: str,
    *,
    limit: int = 10,
) -> list[ReviewSession]:
    """Get the most recent review sessions for session selection."""
    stmt = (
        select(ReviewSession)
        .where(ReviewSession.user_id == user_id)
        .order_by(ReviewSession.updated_at.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_review_sessions(
    session: AsyncSession,
    user_id: str,
    *,
    topic_id: int | None = None,
    effective_date_before: date | None = None,
    effective_date_after: date | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
) -> list[ReviewSession]:
    """List review sessions with optional filters."""
    stmt = (
        select(ReviewSession)
        .where(ReviewSession.user_id == user_id)
        .order_by(
            ReviewSession.completed_at.asc().nulls_first(),
            ReviewSession.scheduled_at.asc(),
            ReviewSession.id.asc(),
        )
        .options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    )

    if topic_id is not None:
        stmt = stmt.where(ReviewSession.reviews.any(Review.topic_id == topic_id))

    if effective_date_before is not None:
        stmt = stmt.where(ReviewSession.effective_date <= effective_date_before)

    if effective_date_after is not None:
        stmt = stmt.where(ReviewSession.effective_date >= effective_date_after)

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
    return list(result.scalars().all())


async def create_review_session(
    session: AsyncSession,
    user_id: str,
    *,
    description: str | None = None,
    notes: str | None = None,
    scheduled_at: date | None = None,
    completed_at: date | None = None,
) -> ReviewSession:
    """Create a new review session."""
    new_review_session = ReviewSession(
        description=description,
        notes=notes,
        scheduled_at=scheduled_at,
        completed_at=completed_at,
        user_id=user_id,
    )
    session.add(new_review_session)
    await session.flush()
    await session.refresh(new_review_session)
    return new_review_session


async def update_review_session(
    session: AsyncSession,
    session_id: int,
    user_id: str,
    *,
    update_values: dict,
) -> ReviewSession:
    """Update a review session.

    If completed_at is being set (from None to a date), sets all null ratings
    to "good" and runs FSRS for affected topics.
    """
    if not update_values:
        raise BadRequestError("No fields to update")

    # Fetch the old review session to check if completed_at is changing
    old_review_session_result = await session.execute(
        select(ReviewSession).where(
            ReviewSession.id == session_id, ReviewSession.user_id == user_id
        )
    )
    old_review_session = old_review_session_result.scalar_one_or_none()
    if not old_review_session:
        raise NotFoundError("Review Session", session_id)
    old_completed_at = old_review_session.completed_at

    # Perform the update
    update_stmt = (
        update(ReviewSession)
        .where(ReviewSession.id == session_id, ReviewSession.user_id == user_id)
        .values(update_values)
    )
    result = await session.execute(update_stmt)
    if result.rowcount == 0:
        raise NotFoundError("Review Session", session_id)

    # Check if completed_at is changing
    completed_at_changed = (
        "completed_at" in update_values
        and update_values["completed_at"] != old_completed_at
    )
    if not completed_at_changed:
        # Fetch and return updated review session
        stmt = (
            select(ReviewSession)
            .where(ReviewSession.id == session_id, ReviewSession.user_id == user_id)
            .options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
        )
        final_result = await session.execute(stmt)
        return final_result.scalar_one()

    # If Review Session is becoming completed (None → date),
    # set all null ratings to "good" and set completion date for reviews.
    # Note: we do nothing if Review Session is becoming uncompleted (date -> None)
    new_completed_at = update_values.get("completed_at")
    if old_completed_at is None and new_completed_at is not None:
        await session.execute(
            update(Review)
            .where(
                Review.review_session_id == session_id,
                Review.user_id == user_id,
                Review.rating.is_(None),
            )
            .values(rating="good", completed_at=new_completed_at)
        )
        await session.flush()

        # Since these topics have now have an additional completed review,
        # we must run FSRS for them:

        # Get the topics
        reviews_result = await session.execute(
            select(Review.topic_id)
            .where(Review.review_session_id == session_id, Review.user_id == user_id)
            .distinct()
        )
        affected_topic_ids = {row[0] for row in reviews_result.all()}

        # Run FSRS on the topics
        # Note: we don't assume that the reviews are latest for each topic
        #       thus, we must replay FSRS for them starting
        earliest_date = min(old_completed_at or date.max, new_completed_at or date.max)
        for topic_id in affected_topic_ids:
            await replay_topic_reviews_from_date(
                session=session,
                topic_id=topic_id,
                user_id=user_id,
                from_date=earliest_date,
            )

    # Return latest results
    stmt = (
        select(ReviewSession)
        .where(ReviewSession.id == session_id, ReviewSession.user_id == user_id)
        .options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    )
    final_result = await session.execute(stmt)
    return final_result.scalar_one()


async def get_topics_for_review_session(
    session: AsyncSession,
    session_id: int,
    user_id: str,
) -> list[Topic]:
    """Get all topics that are part of a review session."""
    stmt = select(Topic).where(
        Topic.reviews.any(Review.review_session_id == session_id),
        Topic.user_id == user_id,
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def delete_review_session(
    session: AsyncSession,
    session_id: int,
    user_id: str,
) -> None:
    """Delete a review session.

    If the session was completed, replays FSRS for affected topics.
    """
    # Fetch the review session to check if it has a completion date
    review_session_result = await session.execute(
        select(ReviewSession).where(
            ReviewSession.id == session_id, ReviewSession.user_id == user_id
        )
    )
    review_session = review_session_result.scalar_one_or_none()

    if not review_session:
        raise NotFoundError("Review Session", session_id)

    completed_at = review_session.completed_at

    # Fetch all reviews associated with this review session to get affected topic IDs
    reviews_result = await session.execute(
        select(Review.topic_id)
        .where(Review.review_session_id == session_id, Review.user_id == user_id)
        .distinct()
    )
    affected_topic_ids = {row[0] for row in reviews_result.all()}

    # Delete the review session (reviews will be cascade deleted if DB is configured)
    stmt = delete(ReviewSession).where(
        ReviewSession.id == session_id, ReviewSession.user_id == user_id
    )
    await session.execute(stmt)

    # Only replay if the review session was completed (had a completion date)
    if completed_at and affected_topic_ids:
        for topic_id in affected_topic_ids:
            await replay_topic_reviews_from_date(
                session=session,
                topic_id=topic_id,
                user_id=user_id,
                from_date=completed_at,
            )
