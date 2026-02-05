"""Review queue business logic (unified, sorted by retrievability)."""

import asyncio

from app.database import get_session_factory
from app.practices.service import list_practices
from app.schemas.review_queue import ReviewQueueItem
from app.sources.service import list_sources
from app.topics.service import list_topics


async def list_review_queue(
    user_id: str,
    *,
    limit: int | None = None,
) -> list[ReviewQueueItem]:
    """Unified review queue across entities, sorted by retrievability then stability."""
    session_factory = get_session_factory()

    async def fetch_topics() -> list[ReviewQueueItem]:
        async with session_factory() as session:
            topics = await list_topics(
                session,
                user_id,
                has_stability=True,
                srs_enabled=True,
                archived=False,
            )
            return [
                ReviewQueueItem(entity_type="topic", topic=topic)
                for topic in topics
                if topic.retrievability is not None
            ]

    async def fetch_sources() -> list[ReviewQueueItem]:
        async with session_factory() as session:
            sources = await list_sources(
                session,
                user_id,
                has_stability=True,
                srs_enabled=True,
                archived=False,
            )
            return [
                ReviewQueueItem(entity_type="source", source=source)
                for source in sources
                if source.retrievability is not None
            ]

    async def fetch_practices() -> list[ReviewQueueItem]:
        async with session_factory() as session:
            practices = await list_practices(
                session,
                user_id,
                has_stability=True,
                srs_enabled=True,
                archived=False,
            )
            return [
                ReviewQueueItem(entity_type="practice", practice=practice)
                for practice in practices
                if practice.retrievability is not None
            ]

    topic_items, source_items, practice_items = await asyncio.gather(
        fetch_topics(),
        fetch_sources(),
        fetch_practices(),
    )

    items: list[ReviewQueueItem] = [*topic_items, *source_items, *practice_items]

    def sort_key(item: ReviewQueueItem) -> tuple[float, float]:
        entity = item.topic or item.source or item.practice
        if entity is None:
            return (float("inf"), float("inf"))
        retrievability = entity.retrievability
        stability = entity.stability
        return (
            retrievability if retrievability is not None else float("inf"),
            stability if stability is not None else float("inf"),
        )

    items.sort(key=sort_key)

    if limit is not None:
        items = items[: max(limit, 0)]

    return items
