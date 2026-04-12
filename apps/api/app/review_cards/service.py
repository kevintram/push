"""Review cards business logic and queue logic."""

from datetime import date, datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import case, delete, desc, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import NotFoundError
from app.models import Review, ReviewCard, ReviewCardTypeAssignment, Topic
from app.review_cards.status_badges import (
    compute_days_until_hazy,
    get_days_until_hazy,
    get_hazy_action_days,
)
from app.schemas.review_cards import (
    ReviewCardFlaggedSummary,
    ReviewCardQueueItem,
    ReviewCardQueuePage,
    ReviewCardQueueSummary,
)
from app.utils.current_date import get_current_date
from app.utils.retrievability import calculate_retrievability, get_freshness_tier


def _queue_sort_key(item: ReviewCardQueueItem) -> tuple[int, int, int, int]:
    action_days = item.action_days
    # Keep overdue scheduled reviews at the front, but show the most recently
    # overdue ones first so focused mode surfaces slightly late cards ahead of
    # very stale ones.
    if item.queue_type == "due" and action_days is not None and action_days < 0:
        return (0, -action_days, 0, item.review_id or item.card.id)

    urgency = action_days if action_days is not None else 999_999
    queue_rank = (
        0 if item.queue_type == "due" else 1 if item.queue_type == "hazy" else 2
    )
    return (1, urgency, queue_rank, item.review_id or item.card.id)


def _apply_action_day_counts(
    *,
    overdue_count: int,
    due_today_count: int,
    due_next_seven_days_count: int,
    action_days: int | None,
) -> tuple[int, int, int]:
    if action_days is None:
        return overdue_count, due_today_count, due_next_seven_days_count
    if action_days < 0:
        return overdue_count + 1, due_today_count, due_next_seven_days_count + 1
    if action_days == 0:
        return overdue_count, due_today_count + 1, due_next_seven_days_count + 1
    if action_days <= 7:
        return overdue_count, due_today_count, due_next_seven_days_count + 1
    return overdue_count, due_today_count, due_next_seven_days_count


def _get_hazy_action_days(
    *,
    review_card_id: int,
    stability: float | None,
    last_reviewed_at: date | None,
    today: date,
) -> int | None:
    retrievability = calculate_retrievability(
        stability,
        last_reviewed_at,
        current_date=today,
    )
    days_until_hazy = compute_days_until_hazy(
        stability=stability,
        last_reviewed_at=last_reviewed_at,
        freshness_tier=get_freshness_tier(retrievability),
        today=today,
    )
    if days_until_hazy is None:
        return None
    return get_hazy_action_days(days_until_hazy)


async def _list_actionable_due_queue_items(
    session: AsyncSession,
    user_id: str,
    *,
    card_type: str,
    as_of: date,
) -> list[ReviewCardQueueItem]:
    due_card_ids_query = (
        select(Review.review_card_id)
        .join(ReviewCard, Review.review_card_id == ReviewCard.id)
        .where(
            Review.user_id == user_id,
            Review.review_card_id.isnot(None),
            Review.completed_at.is_(None),
            Review.scheduled_at.isnot(None),
            ReviewCard.type == card_type,
        )
        .distinct()
    )

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
            selectinload(Review.review_card).selectinload(ReviewCard.type_assignments),
        )
        .order_by(Review.scheduled_at.asc(), Review.id.asc())
    )

    items: list[ReviewCardQueueItem] = []
    seen_review_card_ids: set[int] = set()
    for review in due_result.scalars().all():
        review_card = review.review_card
        if review_card is None or review.scheduled_at is None:
            continue
        if review_card.id in seen_review_card_ids:
            continue
        seen_review_card_ids.add(review_card.id)

        items.append(
            ReviewCardQueueItem(
                queue_type="due",
                card=review_card,
                review_id=review.id,
                scheduled_at=review.scheduled_at,
                action_days=(review.scheduled_at - as_of).days,
                days_until_due=(review.scheduled_at - as_of).days,
                days_until_hazy=None,
            )
        )

    hazy_cards_result = await session.execute(
        select(ReviewCard)
        .where(
            ReviewCard.user_id == user_id,
            ReviewCard.type == card_type,
            ReviewCard.retired.is_(False),
            ~ReviewCard.id.in_(due_card_ids_query),
        )
        .options(
            selectinload(ReviewCard.topic),
            selectinload(ReviewCard.reviews),
            selectinload(ReviewCard.type_assignments),
        )
    )

    for review_card in hazy_cards_result.scalars().unique().all():
        days_until_hazy = get_days_until_hazy(review_card, today=as_of)
        if days_until_hazy is None:
            continue

        items.append(
            ReviewCardQueueItem(
                queue_type="hazy",
                card=review_card,
                review_id=None,
                scheduled_at=None,
                action_days=get_hazy_action_days(days_until_hazy),
                days_until_due=None,
                days_until_hazy=days_until_hazy,
            )
        )

    items.sort(key=_queue_sort_key)
    return items


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
    include_descendants: bool = False,
    card_type: str | None = None,
    new_only: bool | None = None,
    flagged_only: bool | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[ReviewCard]:
    stmt = select(ReviewCard).where(ReviewCard.user_id == user_id)

    if topic_id is not None:
        if include_descendants:
            topic_result = await session.execute(
                select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
            )
            topic = topic_result.scalar_one_or_none()
            if not topic:
                raise NotFoundError("Topic", topic_id)

            stmt = stmt.join(Topic, ReviewCard.topic_id == Topic.id).where(
                Topic.path.op("<@")(topic.path)
            )
        else:
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
    if flagged_only is True:
        stmt = stmt.where(ReviewCard.flagged_at.isnot(None))

    flagged_rank = case((ReviewCard.flagged_at.is_(None), 1), else_=0)
    if order == "asc":
        stmt = stmt.order_by(
            flagged_rank.asc(),
            ReviewCard.flagged_at.desc(),
            ReviewCard.updated_at.asc(),
            ReviewCard.id.asc(),
        )
    else:
        stmt = stmt.order_by(
            flagged_rank.asc(),
            desc(ReviewCard.flagged_at),
            desc(ReviewCard.updated_at),
            desc(ReviewCard.id),
        )

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
    primary_text: str = "",
    secondary_text: str = "",
    notes: str = "",
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
        primary_text=primary_text,
        secondary_text=secondary_text,
        notes=notes,
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
    if "primary_text" in updates and updates["primary_text"] is not None:
        review_card.primary_text = updates["primary_text"]
    if "secondary_text" in updates and updates["secondary_text"] is not None:
        review_card.secondary_text = updates["secondary_text"]
    if "notes" in updates and updates["notes"] is not None:
        review_card.notes = updates["notes"]
    if type_changed:
        await sync_review_card_type_assignment(session, review_card)

    if "retired" in updates and updates["retired"] is not None:
        review_card.retired = updates["retired"]
    if "flagged" in updates and updates["flagged"] is not None:
        review_card.flagged_at = (
            datetime.now(timezone.utc) if updates["flagged"] else None
        )

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
        items = await _list_actionable_due_queue_items(
            session,
            user_id,
            card_type=card_type,
            as_of=as_of,
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
                    action_days=None,
                    days_until_due=None,
                    days_until_hazy=None,
                )
            )

    if focused:
        items = [
            item
            for item in items
            if not (item.queue_type == "hazy" and item.card.freshness_tier == "Fresh")
        ]
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

    due_card_schedule_subquery = (
        select(
            Review.review_card_id.label("review_card_id"),
            func.min(Review.scheduled_at).label("scheduled_at"),
        )
        .join(ReviewCard, Review.review_card_id == ReviewCard.id)
        .where(
            Review.user_id == user_id,
            Review.review_card_id.isnot(None),
            Review.completed_at.is_(None),
            Review.scheduled_at.isnot(None),
            ReviewCard.type == card_type,
        )
        .group_by(Review.review_card_id)
        .subquery()
    )

    due_summary_stmt = select(
        func.coalesce(
            func.sum(
                case((due_card_schedule_subquery.c.scheduled_at < as_of, 1), else_=0)
            ),
            0,
        ).label("overdue_count"),
        func.coalesce(
            func.sum(
                case(
                    (due_card_schedule_subquery.c.scheduled_at == as_of, 1),
                    else_=0,
                )
            ),
            0,
        ).label("due_today_count"),
        func.coalesce(
            func.sum(
                case(
                    (
                        due_card_schedule_subquery.c.scheduled_at <= seven_days_out,
                        1,
                    ),
                    else_=0,
                )
            ),
            0,
        ).label("due_next_seven_days_count"),
    ).select_from(due_card_schedule_subquery)

    due_summary = (await session.execute(due_summary_stmt)).one()

    overdue_count = due_summary.overdue_count
    due_today_count = due_summary.due_today_count
    due_next_seven_days_count = due_summary.due_next_seven_days_count

    due_card_ids_query = (
        select(Review.review_card_id)
        .join(ReviewCard, Review.review_card_id == ReviewCard.id)
        .where(
            Review.user_id == user_id,
            Review.review_card_id.isnot(None),
            Review.completed_at.is_(None),
            Review.scheduled_at.isnot(None),
            ReviewCard.type == card_type,
        )
        .distinct()
    )

    hazy_cards_stmt = select(
        ReviewCard.id,
        ReviewCard.stability,
        ReviewCard.last_reviewed_at,
    ).where(
        ReviewCard.user_id == user_id,
        ReviewCard.type == card_type,
        ReviewCard.retired.is_(False),
        ~ReviewCard.id.in_(due_card_ids_query),
    )

    for review_card_id, stability, last_reviewed_at in await session.execute(
        hazy_cards_stmt
    ):
        overdue_count, due_today_count, due_next_seven_days_count = (
            _apply_action_day_counts(
                overdue_count=overdue_count,
                due_today_count=due_today_count,
                due_next_seven_days_count=due_next_seven_days_count,
                action_days=_get_hazy_action_days(
                    review_card_id=review_card_id,
                    stability=stability,
                    last_reviewed_at=last_reviewed_at,
                    today=as_of,
                ),
            )
        )

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
        overdue_count=overdue_count,
        due_today_count=due_today_count,
        due_next_seven_days_count=due_next_seven_days_count,
        new_count=new_count,
        as_of=as_of,
    )


async def get_review_card_flagged_summary(
    session: AsyncSession,
    user_id: str,
) -> ReviewCardFlaggedSummary:
    flagged_count = (
        await session.execute(
            select(func.count())
            .select_from(ReviewCard)
            .where(
                ReviewCard.user_id == user_id,
                ReviewCard.flagged_at.isnot(None),
            )
        )
    ).scalar_one()

    return ReviewCardFlaggedSummary(flagged_count=flagged_count)
