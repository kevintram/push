"""Review entry business logic.

Review entries provide a unified view of reviews and review sessions.
"""

from datetime import date
from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Review, ReviewSession, Topic


async def list_review_entries(
    session: AsyncSession,
    user_id: str,
    *,
    topic_id: int | None = None,
    effective_date_before: date | None = None,
    effective_date_after: date | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
    sort: Literal["asc", "desc"] = "asc",
) -> tuple[list[ReviewSession], list[tuple]]:
    """Get unified list of reviews and review sessions.

    Returns (review_sessions, review_tuples) for router to process into entries.
    """
    # Query 1: Get all review sessions with their reviews
    sessions_stmt = (
        select(ReviewSession)
        .where(ReviewSession.user_id == user_id)
        .options(
            selectinload(ReviewSession.reviews).selectinload(Review.topic),
            selectinload(ReviewSession.reviews).selectinload(Review.source),
            selectinload(ReviewSession.reviews).selectinload(Review.practice),
        )
    )

    if topic_id is not None:
        sessions_stmt = sessions_stmt.where(
            ReviewSession.reviews.any(Review.topic_id == topic_id)
        )

    if effective_date_before is not None:
        sessions_stmt = sessions_stmt.where(
            ReviewSession.effective_date <= effective_date_before
        )

    if effective_date_after is not None:
        sessions_stmt = sessions_stmt.where(
            ReviewSession.effective_date >= effective_date_after
        )

    if completed is not None:
        if completed:
            sessions_stmt = sessions_stmt.where(ReviewSession.completed_at.isnot(None))
        else:
            sessions_stmt = sessions_stmt.where(ReviewSession.completed_at.is_(None))

    if scheduled is not None:
        if scheduled:
            sessions_stmt = sessions_stmt.where(ReviewSession.scheduled_at.isnot(None))
        else:
            sessions_stmt = sessions_stmt.where(ReviewSession.scheduled_at.is_(None))

    sessions_result = await session.execute(sessions_stmt)
    review_sessions = list(sessions_result.scalars().all())

    # Query 2: Get all reviews (with topic and session info)
    reviews_stmt = (
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
    )

    if topic_id is not None:
        reviews_stmt = reviews_stmt.where(Review.topic_id == topic_id)

    if effective_date_before is not None:
        reviews_stmt = reviews_stmt.where(
            Review.effective_date <= effective_date_before
        )

    if effective_date_after is not None:
        reviews_stmt = reviews_stmt.where(Review.effective_date >= effective_date_after)

    if completed is not None:
        if completed:
            reviews_stmt = reviews_stmt.where(Review.completed_at.isnot(None))
        else:
            reviews_stmt = reviews_stmt.where(Review.completed_at.is_(None))

    if scheduled is not None:
        if scheduled:
            reviews_stmt = reviews_stmt.where(Review.scheduled_at.isnot(None))
        else:
            reviews_stmt = reviews_stmt.where(Review.scheduled_at.is_(None))

    reviews_result = await session.execute(reviews_stmt)
    review_tuples = list(reviews_result.all())

    return review_sessions, review_tuples
