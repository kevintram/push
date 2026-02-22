"""Reviews HTTP endpoints - thin wrapper around service layer."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.reviews import service
from app.schemas.reviews import (
    ReviewCreate,
    ReviewListItem,
    ReviewRead,
    ReviewUpdate,
    ReviewWithNote,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/")
async def read_reviews(
    session: SessionDep,
    user_id: UserIdDep,
    note_id: int | None = None,
    effective_date_before: str | None = None,
    effective_date_after: str | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
    order: Literal["asc", "desc"] = "asc",
) -> list[ReviewListItem]:
    """Get all reviews for the user, with optional filters."""
    date_before = None
    date_after = None
    if effective_date_before is not None:
        date_before = datetime.strptime(effective_date_before, "%Y-%m-%d").date()
    if effective_date_after is not None:
        date_after = datetime.strptime(effective_date_after, "%Y-%m-%d").date()

    results = await service.list_reviews(
        session,
        user_id,
        note_id=note_id,
        effective_date_before=date_before,
        effective_date_after=date_after,
        completed=completed,
        scheduled=scheduled,
        order=order,
    )

    items: list[ReviewListItem] = []
    for review, note_title, note_body in results:
        review_data = ReviewRead.model_validate(review).model_dump()
        review_data["note"] = {
            "id": review.note_id,
            "title": note_title or "",
            "body": note_body or "",
        }
        items.append(ReviewListItem(**review_data))

    return items


@router.get("/{id}/")
async def read_review(
    session: SessionDep,
    user_id: UserIdDep,
    id: int,
) -> ReviewWithNote:
    """Get a specific review by id."""
    review = await service.get_review(session, id, user_id)
    return ReviewWithNote.model_validate(review)


@router.post("/")
async def create_review(
    review_create: ReviewCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithNote:
    """Create a new review."""
    review = await service.create_review(
        session,
        user_id,
        note_id=review_create.note_id,
        description=review_create.description,
        notes=review_create.notes,
        scheduled_at=review_create.scheduled_at,
        completed_at=review_create.completed_at,
        rating=review_create.rating,
    )
    return ReviewWithNote.model_validate(review)


@router.post("/{id}/")
async def update_review(
    id: int,
    review_update: ReviewUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithNote:
    """Update a review and recalculate FSRS state."""
    review = await service.update_review(
        session,
        id,
        user_id,
        description=review_update.description,
        notes=review_update.notes,
        scheduled_at=review_update.scheduled_at,
        completed_at=review_update.completed_at,
        rating=review_update.rating,
        note_id=review_update.note_id,
        fields_set=review_update.model_fields_set,
    )
    return ReviewWithNote.model_validate(review)


@router.delete("/{id}/")
async def delete_review(
    id: int,
    session: SessionDep,
    user_id: UserIdDep,
):
    """Delete a review."""
    await service.delete_review(session, id, user_id)
    return {"message": "Review deleted successfully"}
