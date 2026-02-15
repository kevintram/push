"""Review queue business logic (unified due + hazy queue)."""

import asyncio
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_session_factory
from app.models import Practice, Review, Source, Topic
from app.practices.service import list_practices
from app.schemas.review_queue import ReviewQueueItem
from app.sources.service import list_sources
from app.topics.service import list_topics
from app.utils.retrievability import FINE_THRESHOLD, calculate_days_until_threshold

QueueEntity = Topic | Source | Practice
EntityKey = tuple[str, int]


def _get_days_until_hazy(entity: QueueEntity) -> int | None:
    if entity.stability is None or entity.last_reviewed_at is None:
        return None
    return calculate_days_until_threshold(
        entity.stability,
        entity.last_reviewed_at,
        target_retrievability=FINE_THRESHOLD,
    )


def _get_due_sort_key(item: ReviewQueueItem) -> tuple[int, int]:
    if item.days_until_due is None:
        return (999_999, item.review_id or 0)
    return (item.days_until_due, item.review_id or 0)


async def list_review_queue(
    user_id: str,
    *,
    limit: int | None = None,
) -> list[ReviewQueueItem]:
    """Unified review queue across entities with due reviews and hazy candidates."""
    session_factory = get_session_factory()
    today = date.today()

    async def fetch_topics() -> list[Topic]:
        async with session_factory() as session:
            return await list_topics(
                session,
                user_id,
                has_stability=True,
                srs_enabled=True,
                archived=False,
            )

    async def fetch_sources() -> list[Source]:
        async with session_factory() as session:
            return await list_sources(
                session,
                user_id,
                has_stability=True,
                srs_enabled=True,
                archived=False,
            )

    async def fetch_practices() -> list[Practice]:
        async with session_factory() as session:
            return await list_practices(
                session,
                user_id,
                has_stability=True,
                srs_enabled=True,
                archived=False,
            )

    async def fetch_due_items() -> tuple[list[ReviewQueueItem], set[EntityKey]]:
        async with session_factory() as session:
            result = await session.execute(
                select(Review)
                .where(
                    Review.user_id == user_id,
                    Review.completed_at.is_(None),
                    Review.scheduled_at.isnot(None),
                )
                .options(
                    selectinload(Review.topic)
                    .selectinload(Topic.parent)
                    .selectinload(Topic.fsrs_state),
                    selectinload(Review.topic).selectinload(Topic.fsrs_state),
                    selectinload(Review.source)
                    .selectinload(Source.parent)
                    .selectinload(Source.fsrs_state),
                    selectinload(Review.source).selectinload(Source.fsrs_state),
                    selectinload(Review.practice).selectinload(Practice.fsrs_state),
                )
                .order_by(Review.scheduled_at.asc(), Review.id.asc())
            )
            reviews = list(result.scalars().all())

        due_items: list[ReviewQueueItem] = []
        due_entity_keys: set[EntityKey] = set()

        for review in reviews:
            if review.scheduled_at is None:
                continue

            entity_type: str | None = None
            entity: QueueEntity | None = None

            if review.topic is not None:
                entity_type = "topic"
                entity = review.topic
            elif review.source is not None:
                entity_type = "source"
                entity = review.source
            elif review.practice is not None:
                entity_type = "practice"
                entity = review.practice

            if entity is None or entity_type is None:
                continue
            if entity.archived:
                continue

            due_entity_keys.add((entity_type, entity.id))
            due_items.append(
                ReviewQueueItem(
                    queue_type="due",
                    entity_type=entity_type,
                    topic=review.topic if entity_type == "topic" else None,
                    source=review.source if entity_type == "source" else None,
                    practice=review.practice if entity_type == "practice" else None,
                    review_id=review.id,
                    scheduled_at=review.scheduled_at,
                    days_until_due=(review.scheduled_at - today).days,
                    days_until_hazy=_get_days_until_hazy(entity),
                )
            )

        due_items.sort(key=_get_due_sort_key)
        return due_items, due_entity_keys

    topics, sources, practices, due_results = await asyncio.gather(
        fetch_topics(),
        fetch_sources(),
        fetch_practices(),
        fetch_due_items(),
    )
    due_items, due_entity_keys = due_results

    items: list[ReviewQueueItem] = [*due_items]

    def append_hazy(entity_type: str, entity: QueueEntity) -> None:
        if entity.archived:
            return
        if entity.retrievability is None:
            return
        if (entity_type, entity.id) in due_entity_keys:
            return

        days_until_hazy = _get_days_until_hazy(entity)
        if days_until_hazy is None:
            return

        items.append(
            ReviewQueueItem(
                queue_type="hazy",
                entity_type=entity_type,
                topic=entity if entity_type == "topic" else None,
                source=entity if entity_type == "source" else None,
                practice=entity if entity_type == "practice" else None,
                days_until_hazy=days_until_hazy,
            )
        )

    for topic in topics:
        append_hazy("topic", topic)
    for source in sources:
        append_hazy("source", source)
    for practice in practices:
        append_hazy("practice", practice)

    def sort_key(item: ReviewQueueItem) -> tuple[int, int, int]:
        if item.queue_type == "due":
            urgency = (
                item.days_until_due if item.days_until_due is not None else 999_999
            )
            return (urgency, 0, item.review_id or 0)
        urgency = item.days_until_hazy if item.days_until_hazy is not None else 999_999
        entity = item.topic or item.source or item.practice
        return (urgency, 1, entity.id if entity is not None else 0)

    items.sort(key=sort_key)

    if limit is not None:
        items = items[: max(limit, 0)]

    return items
