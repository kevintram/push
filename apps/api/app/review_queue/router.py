"""Unified review queue endpoint."""

from typing import Literal

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.review_queue import service
from app.schemas.review_cards import ReviewCardQueuePage, ReviewCardTypeEnum

router = APIRouter(prefix="/review-queue", tags=["review-queue"])


@router.get("/")
async def read_review_queue(
    session: SessionDep,
    user_id: UserIdDep,
    type: ReviewCardTypeEnum,
    tab: Literal["due", "new"] = "due",
    focused: bool = False,
    limit: int | None = None,
) -> ReviewCardQueuePage:
    return await service.list_review_queue(
        session,
        user_id,
        card_type=type.value,
        tab=tab,
        focused=focused,
        limit=limit,
    )
