"""Review cards business logic and queue logic."""

from datetime import timedelta
from typing import Literal

from sqlalchemy import case, delete, desc, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import NotFoundError
from app.models import Review, ReviewCard, ReviewCardTypeAssignment, Topic
from app.schemas.review_cards import (
    ReviewCardQueueItem,
    ReviewCardQueuePage,
    ReviewCardQueueSummary,
)
from app.utils.current_date import get_current_date


async def sync_review_card_type_assignment(
    session: AsyncSession, review_card: ReviewCard
) -> None:
    await session.execute(
        delete(ReviewCardTypeAssignment).where(
            ReviewCardTypeAssignment.review_card_id == review_card.id
        )
    )
    session.add(
        ReviewCardTypeAssignment(review_card_id=review_card.id, type=review_card.type)
    )


async def get_review_card(
    session: AsyncSession, review_card_id: int, user_id: str
) -> ReviewCard:
    stmt = (
        select(ReviewCard)
        .where(ReviewCard.id == review_card_id, ReviewCard.user_id == user_id)
        .options(
            selectinload(ReviewCard.topic),
            selectinload(ReviewCard.reviews),
            selectinload(ReviewCard.type_assignments),
        )
    )
    result = await session.execute(stmt)
    review_card = result.scalar_one_or_none()
    if not review_card:
        raise NotFoundError("Review card", review_card_id)
    return review_card


async def list_review_cards(
    session: AsyncSession,
    user_id: str,
    *,
    topic_id: int | None = None,
    card_type: str | None = None,
    new_only: bool | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[ReviewCard]:
    stmt = select(ReviewCard).where(ReviewCard.user_id == user_id)

    if topic_id is not None:
        stmt = stmt.where(ReviewCard.topic_id == topic_id)
    if card_type is not None:
        stmt = stmt.where(ReviewCard.type == card_type)
    if new_only is True:
        completed_exists = (
            select(Review.id)
            .where(
                Review.review_card_id == ReviewCard.id,
                Review.completed_at.isnot(None),
            )
            .limit(1)
        )
        stmt = stmt.where(~exists(completed_exists))

    if order == "asc":
        stmt = stmt.order_by(ReviewCard.updated_at.asc())
    else:
        stmt = stmt.order_by(desc(ReviewCard.updated_at))

    stmt = stmt.options(
        selectinload(ReviewCard.topic),
        selectinload(ReviewCard.reviews),
        selectinload(ReviewCard.type_assignments),
    )

    result = await session.execute(stmt)
    return list(result.scalars().unique().all())


async def create_review_card(
    session: AsyncSession,
    user_id: str,
    *,
    topic_id: int,
    type: str,
    prompt: str = "",
    answer: str = "",
    retired: bool = False,
) -> ReviewCard:
    topic_result = await session.execute(
        select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic", topic_id)

    review_card = ReviewCard(
        user_id=user_id,
        topic_id=topic_id,
        type=type,
        prompt=prompt,
        answer=answer,
        retired=retired,
    )

    session.add(review_card)
    await session.flush()
    await sync_review_card_type_assignment(session, review_card)

    return await get_review_card(session, review_card.id, user_id)


async def update_review_card(
    session: AsyncSession,
    review_card_id: int,
    user_id: str,
    *,
    updates: dict,
) -> ReviewCard:
    review_card = await get_review_card(session, review_card_id, user_id)

    if "topic_id" in updates and updates["topic_id"] is not None:
        new_topic_id = updates["topic_id"]
        topic_result = await session.execute(
            select(Topic).where(Topic.id == new_topic_id, Topic.user_id == user_id)
        )
        topic = topic_result.scalar_one_or_none()
        if not topic:
            raise NotFoundError("Topic", new_topic_id)
        review_card.topic_id = new_topic_id

    type_changed = False
    if "type" in updates and updates["type"] is not None:
        review_card.type = updates["type"]
        type_changed = True
    if "prompt" in updates and updates["prompt"] is not None:
        review_card.prompt = updates["prompt"]
    if "answer" in updates and updates["answer"] is not None:
        review_card.answer = updates["answer"]
    if type_changed:
        await sync_review_card_type_assignment(session, review_card)

    if "retired" in updates and updates["retired"] is not None:
        review_card.retired = updates["retired"]

    await session.flush()
    return await get_review_card(session, review_card_id, user_id)


async def delete_review_card(
    session: AsyncSession,
    review_card_id: int,
    user_id: str,
) -> None:
    review_card = await get_review_card(session, review_card_id, user_id)
    await session.delete(review_card)
    await session.flush()


async def list_review_card_queue(
    session: AsyncSession,
    user_id: str,
    *,
    card_type: str,
    tab: Literal["due", "new"] = "due",
    focused: bool = False,
    limit: int | None = None,
) -> ReviewCardQueuePage:
    as_of = get_current_date()

    items: list[ReviewCardQueueItem] = []

    if tab == "due":
        due_result = await session.execute(
            select(Review)
            .join(ReviewCard, Review.review_card_id == ReviewCard.id)
            .where(
                Review.user_id == user_id,
                Review.review_card_id.isnot(None),
                Review.completed_at.is_(None),
                Review.scheduled_at.isnot(None),
                ReviewCard.type == card_type,
            )
            .options(
                selectinload(Review.review_card).selectinload(ReviewCard.topic),
                selectinload(Review.review_card).selectinload(ReviewCard.reviews),
                selectinload(Review.review_card).selectinload(
                    ReviewCard.type_assignments
                ),
            )
            .order_by(Review.scheduled_at.asc(), Review.id.asc())
        )

        for review in due_result.scalars().all():
            review_card = review.review_card
            if review_card is None:
                continue
            if review_card.retired:
                continue
            if review.scheduled_at is None:
                continue

            items.append(
                ReviewCardQueueItem(
                    queue_type="due",
                    card=review_card,
                    review_id=review.id,
                    scheduled_at=review.scheduled_at,
                    days_until_due=(review.scheduled_at - as_of).days,
                )
            )
    else:
        new_cards_result = await session.execute(
            select(ReviewCard)
            .where(
                ReviewCard.user_id == user_id,
                ReviewCard.type == card_type,
                ~exists(
                    select(Review.id)
                    .where(
                        Review.review_card_id == ReviewCard.id,
                        Review.completed_at.isnot(None),
                    )
                    .limit(1)
                ),
            )
            .options(
                selectinload(ReviewCard.topic),
                selectinload(ReviewCard.reviews),
                selectinload(ReviewCard.type_assignments),
            )
            .order_by(ReviewCard.inserted_at.desc(), ReviewCard.id.desc())
        )

        for review_card in new_cards_result.scalars().unique().all():
            if review_card.retired:
                continue
            items.append(
                ReviewCardQueueItem(
                    queue_type="new",
                    card=review_card,
                    review_id=None,
                    scheduled_at=None,
                    days_until_due=None,
                )
            )

    if focused:
        resolved_limit = limit
        if resolved_limit is None:
            resolved_limit = 1 if card_type == "flashcard" else 5
        items = items[:resolved_limit]

    return ReviewCardQueuePage(items=items, as_of=as_of)


async def get_review_card_queue_summary(
    session: AsyncSession,
    user_id: str,
    *,
    card_type: str,
) -> ReviewCardQueueSummary:
    as_of = get_current_date()
    seven_days_out = as_of + timedelta(days=7)

    due_summary_stmt = (
        select(
            func.coalesce(
                func.sum(case((Review.scheduled_at < as_of, 1), else_=0)),
                0,
            ).label("overdue_count"),
            func.coalesce(
                func.sum(case((Review.scheduled_at == as_of, 1), else_=0)),
                0,
            ).label("due_today_count"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            (Review.scheduled_at > as_of)
                            & (Review.scheduled_at <= seven_days_out),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("due_next_seven_days_count"),
        )
        .select_from(Review)
        .join(ReviewCard, Review.review_card_id == ReviewCard.id)
        .where(
            Review.user_id == user_id,
            Review.review_card_id.isnot(None),
            Review.completed_at.is_(None),
            Review.scheduled_at.isnot(None),
            ReviewCard.type == card_type,
            ReviewCard.retired.is_(False),
        )
    )

    due_summary = (await session.execute(due_summary_stmt)).one()

    completed_review_exists = (
        select(Review.id)
        .where(
            Review.review_card_id == ReviewCard.id,
            Review.completed_at.isnot(None),
        )
        .limit(1)
    )
    new_count_stmt = (
        select(func.count())
        .select_from(ReviewCard)
        .where(
            ReviewCard.user_id == user_id,
            ReviewCard.type == card_type,
            ReviewCard.retired.is_(False),
            ~exists(completed_review_exists),
        )
    )
    new_count = (await session.execute(new_count_stmt)).scalar_one()

    return ReviewCardQueueSummary(
        overdue_count=due_summary.overdue_count,
        due_today_count=due_summary.due_today_count,
        due_next_seven_days_count=due_summary.due_next_seven_days_count,
        new_count=new_count,
        as_of=as_of,
    )
