"""Review cards HTTP endpoints."""

from typing import Literal

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.exceptions import BadRequestError
from app.review_cards import service
from app.reviews import service as reviews_service
from app.schemas.review_cards import (
    ReviewCardCreate,
    ReviewCardFilterEnum,
    ReviewCardFlaggedSummary,
    ReviewCardQueuePage,
    ReviewCardQueueSummary,
    ReviewCardRead,
    ReviewCardReviewCreate,
    ReviewCardTypeEnum,
    ReviewCardUpdate,
)
from app.schemas.reviews import ReviewWithCard

router = APIRouter(prefix="/review-cards", tags=["review-cards"])


@router.get("/")
async def read_review_cards(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int | None = None,
    include_descendants: bool = False,
    type: ReviewCardTypeEnum | None = None,
    new_only: bool | None = None,
    flagged_only: bool | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[ReviewCardRead]:
    if include_descendants and topic_id is None:
        raise BadRequestError("topic_id is required when include_descendants is true")

    return await service.list_review_cards(
        session,
        user_id,
        topic_id=topic_id,
        include_descendants=include_descendants,
        card_type=type.value if type else None,
        new_only=new_only,
        flagged_only=flagged_only,
        order=order,
    )


@router.get("/queue/")
async def read_review_card_queue(
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
    return await service.list_review_card_queue(
        session,
        user_id,
        card_types=service.resolve_queue_card_types(
            card_type=type, review_filter=filter
        ),
        include_future=include_future,
        focused=focused,
        limit=limit,
        mode=mode,
        tab=tab,
    )


@router.get("/queue-summary/")
async def read_review_card_queue_summary(
    session: SessionDep,
    user_id: UserIdDep,
    type: ReviewCardTypeEnum | None = None,
    filter: ReviewCardFilterEnum | None = None,
) -> ReviewCardQueueSummary:
    return await service.get_review_card_queue_summary(
        session,
        user_id,
        card_types=service.resolve_queue_card_types(
            card_type=type, review_filter=filter
        ),
    )


@router.get("/flagged-summary/")
async def read_review_card_flagged_summary(
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewCardFlaggedSummary:
    return await service.get_review_card_flagged_summary(session, user_id)


@router.get("/{review_card_id}/")
async def read_review_card(
    session: SessionDep,
    user_id: UserIdDep,
    review_card_id: int,
) -> ReviewCardRead:
    return await service.get_review_card(session, review_card_id, user_id)


@router.post("/", status_code=201)
async def insert_review_card(
    payload: ReviewCardCreate, session: SessionDep, user_id: UserIdDep
) -> ReviewCardRead:
    data = payload.model_dump()
    card_type = data.pop("type")
    return await service.create_review_card(
        session,
        user_id,
        type=card_type.value,
        **data,
    )


@router.patch("/{review_card_id}/")
async def update_review_card(
    review_card_id: int,
    payload: ReviewCardUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewCardRead:
    updates = payload.model_dump(exclude_unset=True)
    if "type" in updates and updates["type"] is not None:
        updates["type"] = updates["type"].value
    return await service.update_review_card(
        session,
        review_card_id,
        user_id,
        updates=updates,
    )


@router.delete("/{review_card_id}/", status_code=204)
async def delete_review_card(
    review_card_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    await service.delete_review_card(session, review_card_id, user_id)


@router.post("/{review_card_id}/reviews/")
async def create_review_for_card(
    review_card_id: int,
    payload: ReviewCardReviewCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> ReviewWithCard:
    review = await reviews_service.create_review(
        session,
        user_id,
        review_card_id=review_card_id,
        description=payload.description,
        notes=payload.notes,
        scheduled_at=payload.scheduled_at,
        completed_at=payload.completed_at,
        rating=payload.rating.value if payload.rating else None,
    )
    return ReviewWithCard.model_validate(review)
