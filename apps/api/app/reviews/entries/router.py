"""Review entries HTTP endpoints - thin wrapper around service layer."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.reviews.entries import service
from app.schemas import ReviewListItem, ReviewRead, ReviewSessionReadWithReviews
from app.schemas.review_entries import (
    ReviewEntriesResponse,
    ReviewEntry,
    ReviewEntryReview,
    ReviewEntrySession,
)

router = APIRouter(prefix="/review-entries", tags=["review-entries"])


@router.get("/")
async def read_review_entries(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int | None = None,
    effective_date_before: str | None = None,
    effective_date_after: str | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
    sort: Literal["asc", "desc"] = "asc",
    limit: int | None = None,
    include_count: bool = False,
) -> list[ReviewEntry] | ReviewEntriesResponse:
    """Get unified list of reviews and review sessions, sorted by effective_date.

    Returns all reviews and all review sessions as separate entries in a
    discriminated union.

    Args:
        sort: Sort order for effective_date. "asc" = nulls first, then ascending.
              "desc" = descending, then nulls last.
    """
    # Parse date strings
    date_before = None
    date_after = None
    if effective_date_before is not None:
        date_before = datetime.strptime(effective_date_before, "%Y-%m-%d").date()
    if effective_date_after is not None:
        date_after = datetime.strptime(effective_date_after, "%Y-%m-%d").date()

    review_sessions, review_tuples = await service.list_review_entries(
        session,
        user_id,
        topic_id=topic_id,
        effective_date_before=date_before,
        effective_date_after=date_after,
        completed=completed,
        scheduled=scheduled,
        sort=sort,
        limit=limit,
    )

    entries: list[ReviewEntry] = []

    # Process review sessions
    for rs in review_sessions:
        entries.append(
            ReviewEntrySession(
                effective_date=rs.effective_date,
                data=ReviewSessionReadWithReviews.model_validate(rs),
            )
        )

    # Process reviews
    for (
        review,
        row_topic_id,
        topic_name,
        topic_notes,
        row_review_session_id,
        review_session_description,
    ) in review_tuples:
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

    if limit is not None:
        entries = entries[:limit]

    if include_count:
        total = await service.count_review_entries(
            session,
            user_id,
            topic_id=topic_id,
            effective_date_before=date_before,
            effective_date_after=date_after,
            completed=completed,
            scheduled=scheduled,
        )
        return ReviewEntriesResponse(entries=entries, total=total)

    return entries
