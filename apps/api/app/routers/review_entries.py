from datetime import datetime
from typing import Literal

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import SessionDep, UserIdDep
from app.models import Review, ReviewSession, Topic
from app.schemas import ReviewListItem, ReviewRead, ReviewSessionReadWithReviews
from app.schemas.review_entries import ReviewEntry, ReviewEntryReview, ReviewEntrySession

router = APIRouter()


@router.get("/review-entries/", tags=["review-entries"])
async def read_review_entries(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int | None = None,
    effective_date_before: str | None = None,
    effective_date_after: str | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
    sort: Literal["asc", "desc"] = "asc",
) -> list[ReviewEntry]:
    """Get unified list of reviews and review sessions, sorted by effective_date.

    Returns all reviews and all review sessions as separate entries in a
    discriminated union.

    Args:
        sort: Sort order for effective_date. "asc" = nulls first, then ascending.
              "desc" = descending, then nulls last.
    """
    entries: list[ReviewEntry] = []

    # Query 1: Get all review sessions with their reviews
    sessions_stmt = (
        select(ReviewSession)
        .where(ReviewSession.user_id == user_id)
        .options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    )

    if topic_id is not None:
        sessions_stmt = sessions_stmt.where(
            ReviewSession.reviews.any(Review.topic_id == topic_id)
        )

    if effective_date_before is not None:
        date_before = datetime.strptime(effective_date_before, "%Y-%m-%d").date()
        sessions_stmt = sessions_stmt.where(ReviewSession.effective_date <= date_before)

    if effective_date_after is not None:
        date_after = datetime.strptime(effective_date_after, "%Y-%m-%d").date()
        sessions_stmt = sessions_stmt.where(ReviewSession.effective_date >= date_after)

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
    review_sessions = sessions_result.scalars().all()

    for rs in review_sessions:
        entries.append(
            ReviewEntrySession(
                effective_date=rs.effective_date,
                data=ReviewSessionReadWithReviews.model_validate(rs),
            )
        )

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
        date_before = datetime.strptime(effective_date_before, "%Y-%m-%d").date()
        reviews_stmt = reviews_stmt.where(Review.effective_date <= date_before)

    if effective_date_after is not None:
        date_after = datetime.strptime(effective_date_after, "%Y-%m-%d").date()
        reviews_stmt = reviews_stmt.where(Review.effective_date >= date_after)

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

    for (
        review,
        row_topic_id,
        topic_name,
        topic_notes,
        row_review_session_id,
        review_session_description,
    ) in reviews_result.all():
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
        review_list_item = ReviewListItem(**review_data)
        entries.append(
            ReviewEntryReview(
                effective_date=review.effective_date,
                data=review_list_item,
            )
        )

    # Sort by effective_date based on sort parameter
    if sort == "asc":
        # Ascending: nulls first, then oldest to newest
        entries.sort(key=lambda e: (e.effective_date is not None, e.effective_date))
    else:
        # Descending: newest to oldest, then nulls last
        entries.sort(
            key=lambda e: (e.effective_date is None, e.effective_date),
            reverse=True,
        )

    return entries
