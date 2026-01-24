"""Review sessions HTTP endpoints - thin wrapper around service layer."""

from datetime import datetime

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.reviews.sessions import service
from app.schemas import (
    ReviewSessionCreate,
    ReviewSessionRead,
    ReviewSessionReadWithReviews,
    ReviewSessionUpdate,
    SourceRead,
    TopicRead,
)

router = APIRouter(prefix="/review-sessions", tags=["review-sessions"])


@router.get("/recent/")
async def read_recent_review_sessions(
    session: SessionDep,
    user_id: UserIdDep,
    limit: int = 10,
) -> list[ReviewSessionRead]:
    """Get the most recent review sessions for session selection."""
    return await service.list_recent_review_sessions(session, user_id, limit=limit)


@router.get("/")
async def read_review_sessions(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int | None = None,
    source_id: int | None = None,
    effective_date_before: str | None = None,
    effective_date_after: str | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
) -> list[ReviewSessionReadWithReviews]:
    """List review sessions with optional filters."""
    # Parse date strings
    date_before = None
    date_after = None
    if effective_date_before is not None:
        date_before = datetime.strptime(effective_date_before, "%Y-%m-%d").date()
    if effective_date_after is not None:
        date_after = datetime.strptime(effective_date_after, "%Y-%m-%d").date()

    return await service.list_review_sessions(
        session,
        user_id,
        topic_id=topic_id,
        source_id=source_id,
        effective_date_before=date_before,
        effective_date_after=date_after,
        completed=completed,
        scheduled=scheduled,
    )


@router.get("/{review_session_id}/")
async def read_review_session(
    session: SessionDep,
    user_id: UserIdDep,
    review_session_id: int,
) -> ReviewSessionReadWithReviews:
    """Get a specific review session by id."""
    return await service.get_review_session(session, review_session_id, user_id)


@router.post("/")
async def create_review_session(
    review_session: ReviewSessionCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewSessionRead:
    """Create a new review session."""
    return await service.create_review_session(
        session,
        user_id,
        description=review_session.description,
        notes=review_session.notes,
        scheduled_at=review_session.scheduled_at,
        completed_at=review_session.completed_at,
    )


@router.post("/{review_session_id}/")
async def update_review_session(
    review_session_id: int,
    review_session: ReviewSessionUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewSessionRead:
    """Update a review session."""
    update_values = review_session.model_dump(
        exclude_unset=True, exclude={"id", "user_id"}
    )
    return await service.update_review_session(
        session,
        review_session_id,
        user_id,
        update_values=update_values,
    )


@router.get("/{review_session_id}/topics/")
async def read_topics_for_review_session(
    review_session_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[TopicRead]:
    """Get all topics that are part of a review session."""
    return await service.get_topics_for_review_session(
        session, review_session_id, user_id
    )


@router.get("/{review_session_id}/sources/")
async def read_sources_for_review_session(
    review_session_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[SourceRead]:
    """Get all sources that are part of a review session."""
    return await service.get_sources_for_review_session(
        session, review_session_id, user_id
    )


@router.delete("/{review_session_id}/")
async def delete_review_session(
    review_session_id: int,
    session: SessionDep,
    user_id: UserIdDep,
):
    """Delete a review session."""
    await service.delete_review_session(session, review_session_id, user_id)
    return {"message": "Review Session deleted successfully"}
