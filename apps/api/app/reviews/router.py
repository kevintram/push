"""Reviews HTTP endpoints - review-card only."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.reviews import service
from app.schemas.reviews import (
    ReviewCreate,
    ReviewListItem,
    ReviewUpdate,
    ReviewWithCard,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/")
async def read_reviews(
    session: SessionDep,
    user_id: UserIdDep,
    review_card_id: int | None = None,
    effective_date_before: str | None = None,
    effective_date_after: str | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
    order: Literal["asc", "desc"] = "asc",
) -> list[ReviewListItem]:
    date_before = None
    date_after = None
    if effective_date_before is not None:
        date_before = datetime.strptime(effective_date_before, "%Y-%m-%d").date()
    if effective_date_after is not None:
        date_after = datetime.strptime(effective_date_after, "%Y-%m-%d").date()

    reviews = await service.list_reviews(
        session,
        user_id,
        review_card_id=review_card_id,
        effective_date_before=date_before,
        effective_date_after=date_after,
        completed=completed,
        scheduled=scheduled,
        order=order,
    )
    return [ReviewListItem.model_validate(review) for review in reviews]


@router.get("/{id}/")
async def read_review(
    session: SessionDep,
    user_id: UserIdDep,
    id: int,
) -> ReviewWithCard:
    review = await service.get_review(session, id, user_id)
    return ReviewWithCard.model_validate(review)


@router.post("/")
async def create_review(
    review_create: ReviewCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithCard:
    review = await service.create_review(
        session,
        user_id,
        review_card_id=review_create.review_card_id,
        description=review_create.description,
        notes=review_create.notes,
        scheduled_at=review_create.scheduled_at,
        completed_at=review_create.completed_at,
        rating=review_create.rating.value if review_create.rating else None,
    )
    return ReviewWithCard.model_validate(review)


@router.post("/{id}/")
async def update_review(
    id: int,
    review_update: ReviewUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithCard:
    review = await service.update_review(
        session,
        id,
        user_id,
        description=review_update.description,
        notes=review_update.notes,
        scheduled_at=review_update.scheduled_at,
        completed_at=review_update.completed_at,
        rating=review_update.rating.value if review_update.rating else None,
        review_card_id=review_update.review_card_id,
        fields_set=review_update.model_fields_set,
    )
    return ReviewWithCard.model_validate(review)


@router.delete("/{id}/")
async def delete_review(
    id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> dict[str, str]:
    await service.delete_review(session, id, user_id)
    return {"message": "Review deleted successfully"}
