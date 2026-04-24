"""Review queue business logic (review-card centric)."""

from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.review_cards import service as review_cards_service
from app.schemas.review_cards import ReviewCardQueuePage


async def list_review_queue(
    session: AsyncSession,
    user_id: str,
    *,
    card_types: tuple[str, ...],
    tab: Literal["due", "new"] = "due",
    focused: bool = False,
    limit: int | None = None,
) -> ReviewCardQueuePage:
    return await review_cards_service.list_review_card_queue(
        session,
        user_id,
        card_types=card_types,
        tab=tab,
        focused=focused,
        limit=limit,
    )
