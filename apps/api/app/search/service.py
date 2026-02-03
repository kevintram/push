"""Unified search across all entity types."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.practices.service import list_practices
from app.schemas.search import SearchResultItem
from app.sources.service import list_sources
from app.topics.service import list_topics


async def search_all(
    session: AsyncSession,
    user_id: str,
    *,
    query: str | None = None,
    entity_types: list[str] | None = None,
    limit: int = 50,
) -> list[SearchResultItem]:
    """Unified search across all entity types, ordered by recent activity."""
    results: list[SearchResultItem] = []

    if entity_types is None or "topic" in entity_types:
        topics = await list_topics(
            session,
            user_id,
            query=query,
            order_by="recent_activity",
            limit=limit,
        )
        results.extend(
            SearchResultItem(
                entity_type="topic",
                topic=t,
                recent_activity_at=t.recent_activity_at or t.updated_at,
            )
            for t in topics
        )

    if entity_types is None or "source" in entity_types:
        sources = await list_sources(
            session,
            user_id,
            query=query,
            order_by="recent_activity",
            limit=limit,
        )
        results.extend(
            SearchResultItem(
                entity_type="source",
                source=s,
                recent_activity_at=s.recent_activity_at or s.updated_at,
            )
            for s in sources
        )

    if entity_types is None or "practice" in entity_types:
        practices = await list_practices(
            session,
            user_id,
            query=query,
            order_by="recent_activity",
            limit=limit,
        )
        results.extend(
            SearchResultItem(
                entity_type="practice",
                practice=p,
                recent_activity_at=p.recent_activity_at or p.updated_at,
            )
            for p in practices
        )

    results.sort(key=lambda x: x.recent_activity_at, reverse=True)
    return results[:limit]
