"""Reviews HTTP endpoints - thin wrapper around service layer."""

from datetime import datetime

from fastapi import APIRouter

from app.dependencies import SessionDep, UserIdDep
from app.reviews import service
from app.schemas import (
    ReviewCreate,
    ReviewListItem,
    ReviewRead,
    ReviewUpdate,
    ReviewWithSource,
    ReviewWithTopic,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/")
async def read_reviews(
    session: SessionDep,
    user_id: UserIdDep,
    review_session_id: int | None = None,
    topic_id: int | None = None,
    source_id: int | None = None,
    effective_date_before: str | None = None,
    effective_date_after: str | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
) -> list[ReviewListItem]:
    """Get all reviews for the user, with optional filters.

    Supports polymorphic reviews (topic or source).
    """
    # Parse date strings
    date_before = None
    date_after = None
    if effective_date_before is not None:
        date_before = datetime.strptime(effective_date_before, "%Y-%m-%d").date()
    if effective_date_after is not None:
        date_after = datetime.strptime(effective_date_after, "%Y-%m-%d").date()

    results = await service.list_reviews(
        session,
        user_id,
        review_session_id=review_session_id,
        topic_id=topic_id,
        source_id=source_id,
        effective_date_before=date_before,
        effective_date_after=date_after,
        completed=completed,
        scheduled=scheduled,
    )

    items: list[ReviewListItem] = []
    for (
        review,
        row_topic_id,
        topic_name,
        topic_notes,
        row_source_id,
        source_title,
        source_notes,
        row_review_session_id,
        review_session_description,
    ) in results:
        review_data = ReviewRead.model_validate(review).model_dump()

        # Set polymorphic fields
        review_data["topic_id"] = row_topic_id
        review_data["source_id"] = row_source_id

        # Set topic if present
        review_data["topic"] = (
            {"id": row_topic_id, "name": topic_name, "notes": topic_notes}
            if row_topic_id is not None
            else None
        )

        # Set source if present
        review_data["source"] = (
            {"id": row_source_id, "title": source_title, "notes": source_notes}
            if row_source_id is not None
            else None
        )

        review_data["review_session"] = (
            {"id": row_review_session_id, "description": review_session_description}
            if row_review_session_id is not None
            else None
        )
        items.append(ReviewListItem(**review_data))
    return items


@router.get("/{id}/")
async def read_review(
    session: SessionDep,
    user_id: UserIdDep,
    id: int,
) -> ReviewWithTopic | ReviewWithSource:
    """Get a specific review by id (polymorphic - topic or source)."""
    review = await service.get_review(session, id, user_id)

    # Return appropriate type based on whether it's a topic or source review
    if review.source is not None:
        return ReviewWithSource.model_validate(review)
    return ReviewWithTopic.model_validate(review)


@router.post("/")
async def create_review(
    review_create: ReviewCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithTopic | ReviewWithSource:
    """Create a new review for a topic or source (polymorphic).

    Supports creating and linking entities in any combination:
    - For topic reviews: provide topic_id or topic (inline creation)
    - For source reviews: provide source_id or source (inline creation)
    - Optionally link to a review session via review_session_id or review_session
    """
    # Convert Pydantic models to dicts for service layer
    topic_data = None
    if review_create.topic is not None:
        topic_data = review_create.topic.model_dump(
            exclude={"srs_enabled", "inherit_fsrs"}
        )
        topic_data["srs_enabled"] = review_create.topic.srs_enabled

    source_data = None
    if review_create.source is not None:
        source_data = review_create.source.model_dump(
            exclude={"srs_enabled", "inherit_fsrs"}
        )
        source_data["srs_enabled"] = review_create.source.srs_enabled

    review_session_data = None
    if review_create.review_session is not None:
        review_session_data = review_create.review_session.model_dump()

    review = await service.create_review(
        session,
        user_id,
        topic_id=review_create.topic_id,
        topic_data=topic_data,
        source_id=review_create.source_id,
        source_data=source_data,
        review_session_id=review_create.review_session_id,
        review_session_data=review_session_data,
        description=review_create.description,
        scheduled_at=review_create.scheduled_at,
        completed_at=review_create.completed_at,
        rating=review_create.rating,
    )

    # Return appropriate type based on whether it's a topic or source review
    if review.source is not None:
        return ReviewWithSource.model_validate(review)
    return ReviewWithTopic.model_validate(review)


@router.post("/{id}/")
async def update_review(
    id: int,
    review_update: ReviewUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithTopic | ReviewWithSource:
    """Update a review's rating/completion and recalculate FSRS state (polymorphic)."""
    fields_set = review_update.model_fields_set

    review = await service.update_review(
        session,
        id,
        user_id,
        description=review_update.description,
        notes=review_update.notes,
        scheduled_at=review_update.scheduled_at,
        completed_at=review_update.completed_at,
        rating=review_update.rating,
        review_session_id=review_update.review_session_id,
        fields_set=fields_set,
    )

    # Return appropriate type based on whether it's a topic or source review
    if review.source is not None:
        return ReviewWithSource.model_validate(review)
    return ReviewWithTopic.model_validate(review)


@router.delete("/{id}/")
async def delete_review(
    id: int,
    session: SessionDep,
    user_id: UserIdDep,
):
    """Delete a review and restore entity (topic or source) to its before state."""
    await service.delete_review(session, id, user_id)
    return {"message": "Review deleted successfully"}
