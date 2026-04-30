"""Unified review queue endpoint."""

from typing import Literal

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.review_cards.service import resolve_queue_card_types
from app.review_queue import service
from app.schemas.review_cards import (
    ReviewCardFilterEnum,
    ReviewCardQueuePage,
    ReviewCardTypeEnum,
)

router = APIRouter(prefix="/review-queue", tags=["review-queue"])


@router.get("/")
async def read_review_queue(
    session: SessionDep,
    user_id: UserIdDep,
    type: ReviewCardTypeEnum | None = None,
    filter: ReviewCardFilterEnum | None = None,
    mode: Literal["list", "focus"] = "list",
    include_future: bool = False,
    tab: Literal["due", "new"] | None = None,
    focused: bool = False,
    limit: int | None = None,
) -> ReviewCardQueuePage:
    return await service.list_review_queue(
        session,
        user_id,
        card_types=resolve_queue_card_types(card_type=type, review_filter=filter),
        include_future=include_future,
        focused=focused,
        limit=limit,
        mode=mode,
        tab=tab,
    )
