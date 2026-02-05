"""Unified search across all entity types."""

import asyncio

from app.database import get_session_factory
from app.practices.service import list_practices
from app.schemas.search import SearchResultItem
from app.sources.service import list_sources
from app.topics.service import list_topics


async def search_all(
    user_id: str,
    *,
    query: str | None = None,
    entity_types: list[str] | None = None,
    inboxed: bool | None = None,
    archived: bool | None = None,
    limit: int | None = None,
) -> list[SearchResultItem]:
    """Unified search across all entity types, ordered by recent activity."""
    session_factory = get_session_factory()

    async def fetch_topics() -> list[SearchResultItem]:
        async with session_factory() as session:
            topics = await list_topics(
                session,
                user_id,
                query=query,
                inboxed=inboxed,
                archived=archived,
                order_by="recent_activity",
                limit=limit,
            )
            return [
                SearchResultItem(
                    entity_type="topic",
                    topic=t,
                    recent_activity_at=t.recent_activity_at or t.updated_at,
                )
                for t in topics
            ]

    async def fetch_sources() -> list[SearchResultItem]:
        async with session_factory() as session:
            sources = await list_sources(
                session,
                user_id,
                query=query,
                inboxed=inboxed,
                archived=archived,
                order_by="recent_activity",
                limit=limit,
            )
            return [
                SearchResultItem(
                    entity_type="source",
                    source=s,
                    recent_activity_at=s.recent_activity_at or s.updated_at,
                )
                for s in sources
            ]

    async def fetch_practices() -> list[SearchResultItem]:
        async with session_factory() as session:
            practices = await list_practices(
                session,
                user_id,
                query=query,
                inboxed=inboxed,
                archived=archived,
                order_by="recent_activity",
                limit=limit,
            )
            return [
                SearchResultItem(
                    entity_type="practice",
                    practice=p,
                    recent_activity_at=p.recent_activity_at or p.updated_at,
                )
                for p in practices
            ]

    fetchers = []
    if entity_types is None or "topic" in entity_types:
        fetchers.append(fetch_topics())
    if entity_types is None or "source" in entity_types:
        fetchers.append(fetch_sources())
    if entity_types is None or "practice" in entity_types:
        fetchers.append(fetch_practices())

    all_results = await asyncio.gather(*fetchers)

    results: list[SearchResultItem] = []
    for items in all_results:
        results.extend(items)

    results.sort(key=lambda x: x.recent_activity_at, reverse=True)
    return results[:limit] if limit is not None else results
