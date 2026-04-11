"""Unified search across topics and review cards."""

from typing import Iterable

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import ReviewCard, Topic
from app.schemas.search import SearchResultItem


def parse_entity_types(entity_types: list[str] | None) -> set[str]:
    if not entity_types:
        return {"topic", "review_card"}

    normalized = {item.strip().lower() for item in entity_types if item.strip()}
    resolved: set[str] = set()
    if "topic" in normalized:
        resolved.add("topic")
    if "review_card" in normalized:
        resolved.add("review_card")
    if "practice" in normalized or "flashcard" in normalized:
        resolved.add("review_card")

    return resolved or {"topic", "review_card"}


async def _search_topics(
    session: AsyncSession,
    user_id: str,
    *,
    query: str | None,
    limit: int,
) -> list[Topic]:
    stmt = select(Topic).where(Topic.user_id == user_id)
    if query:
        q = f"%{query}%"
        stmt = stmt.where(or_(Topic.title.ilike(q), Topic.body.ilike(q)))
    stmt = stmt.options(selectinload(Topic.parent))
    stmt = stmt.order_by(Topic.updated_at.desc()).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().unique().all())


async def _search_review_cards(
    session: AsyncSession,
    user_id: str,
    *,
    query: str | None,
    entity_types: Iterable[str] | None,
    limit: int,
) -> list[ReviewCard]:
    stmt = select(ReviewCard).where(ReviewCard.user_id == user_id)
    if query:
        q = f"%{query}%"
        stmt = stmt.where(
            or_(
                ReviewCard.primary_text.ilike(q),
                ReviewCard.secondary_text.ilike(q),
                ReviewCard.notes.ilike(q),
            )
        )
    normalized = {value.strip().lower() for value in (entity_types or [])}
    if "practice" in normalized and "flashcard" not in normalized:
        stmt = stmt.where(ReviewCard.type == "practice")
    elif "flashcard" in normalized and "practice" not in normalized:
        stmt = stmt.where(ReviewCard.type == "flashcard")

    stmt = stmt.options(
        selectinload(ReviewCard.topic),
        selectinload(ReviewCard.reviews),
        selectinload(ReviewCard.type_assignments),
    )
    stmt = stmt.order_by(ReviewCard.updated_at.desc()).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().unique().all())


async def search_all(
    session: AsyncSession,
    user_id: str,
    *,
    query: str | None = None,
    entity_types: list[str] | None = None,
    limit: int | None = None,
) -> list[SearchResultItem]:
    include_types = parse_entity_types(entity_types)
    per_type_limit = max(limit or 30, 1)

    topics: list[Topic] = []
    review_cards: list[ReviewCard] = []

    if "topic" in include_types:
        topics = await _search_topics(
            session,
            user_id,
            query=query,
            limit=per_type_limit,
        )
    if "review_card" in include_types:
        review_cards = await _search_review_cards(
            session,
            user_id,
            query=query,
            entity_types=entity_types,
            limit=per_type_limit,
        )

    items: list[SearchResultItem] = []
    items.extend(
        SearchResultItem(
            entity_type="topic",
            topic=topic,
            review_card=None,
            recent_activity_at=topic.updated_at,
        )
        for topic in topics
    )
    items.extend(
        SearchResultItem(
            entity_type="review_card",
            topic=None,
            review_card=review_card,
            recent_activity_at=review_card.updated_at,
        )
        for review_card in review_cards
    )

    items.sort(key=lambda item: item.recent_activity_at, reverse=True)
    if limit is not None:
        items = items[:limit]
    return items
