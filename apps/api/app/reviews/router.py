"""Reviews HTTP endpoints - thin wrapper around service layer."""

from datetime import datetime

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.reviews import service
from app.schemas import (
    ReviewCreate,
    ReviewListItem,
    ReviewRead,
    ReviewUpdate,
    ReviewWithPractice,
    ReviewWithSource,
    ReviewWithTopic,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/")
async def read_reviews(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int | None = None,
    source_id: int | None = None,
    practice_id: int | None = None,
    effective_date_before: str | None = None,
    effective_date_after: str | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
) -> list[ReviewListItem]:
    """Get all reviews for the user, with optional filters.

    Supports polymorphic reviews (topic, source, or practice).
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
        topic_id=topic_id,
        source_id=source_id,
        practice_id=practice_id,
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
        row_practice_id,
        practice_prompt,
        practice_answer,
    ) in results:
        review_data = ReviewRead.model_validate(review).model_dump()

        # Set polymorphic fields
        review_data["topic_id"] = row_topic_id
        review_data["source_id"] = row_source_id
        review_data["practice_id"] = row_practice_id

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

        # Set practice if present
        review_data["practice"] = (
            {
                "id": row_practice_id,
                "prompt": practice_prompt,
                "answer": practice_answer,
            }
            if row_practice_id is not None
            else None
        )

        items.append(ReviewListItem(**review_data))
    return items


@router.get("/{id}/")
async def read_review(
    session: SessionDep,
    user_id: UserIdDep,
    id: int,
) -> ReviewWithTopic | ReviewWithSource | ReviewWithPractice:
    """Get a specific review by id (polymorphic - topic, source, or practice)."""
    review = await service.get_review(session, id, user_id)

    # Return appropriate type based on entity type
    if review.practice is not None:
        return ReviewWithPractice.model_validate(review)
    if review.source is not None:
        return ReviewWithSource.model_validate(review)
    return ReviewWithTopic.model_validate(review)


@router.post("/")
async def create_review(
    review_create: ReviewCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithTopic | ReviewWithSource | ReviewWithPractice:
    """Create a new review for a topic, source, or practice (polymorphic).

    Supports creating and linking entities in any combination:
    - For topic reviews: provide topic_id or topic (inline creation)
    - For source reviews: provide source_id or source (inline creation)
    - For practice reviews: provide practice_id or practice (inline creation)
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

    practice_data = None
    if review_create.practice is not None:
        practice_data = review_create.practice.model_dump(exclude={"srs_enabled"})
        practice_data["srs_enabled"] = review_create.practice.srs_enabled

    review = await service.create_review(
        session,
        user_id,
        topic_id=review_create.topic_id,
        topic_data=topic_data,
        source_id=review_create.source_id,
        source_data=source_data,
        practice_id=review_create.practice_id,
        practice_data=practice_data,
        description=review_create.description,
        scheduled_at=review_create.scheduled_at,
        completed_at=review_create.completed_at,
        rating=review_create.rating,
    )

    # Return appropriate type based on entity type
    if review.practice is not None:
        return ReviewWithPractice.model_validate(review)
    if review.source is not None:
        return ReviewWithSource.model_validate(review)
    return ReviewWithTopic.model_validate(review)


@router.post("/{id}/")
async def update_review(
    id: int,
    review_update: ReviewUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithTopic | ReviewWithSource | ReviewWithPractice:
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
        fields_set=fields_set,
    )

    # Return appropriate type based on entity type
    if review.practice is not None:
        return ReviewWithPractice.model_validate(review)
    if review.source is not None:
        return ReviewWithSource.model_validate(review)
    return ReviewWithTopic.model_validate(review)


@router.delete("/{id}/")
async def delete_review(
    id: int,
    session: SessionDep,
    user_id: UserIdDep,
):
    """Delete a review and restore entity (topic, source, or practice) to its before state."""
    await service.delete_review(session, id, user_id)
    return {"message": "Review deleted successfully"}
