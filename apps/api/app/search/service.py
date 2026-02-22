"""Unified note search."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session_factory
from app.models import Note, NoteTag
from app.schemas.search import SearchResultItem

_TAG_FILTER_MAP = {
    "topic": "TOPIC",
    "source": "SOURCE",
    "practice": "PRACTICE",
}


async def _list_notes_for_search(
    session: AsyncSession,
    user_id: str,
    *,
    query: str | None,
    entity_types: list[str] | None,
    inboxed: bool | None,
    archived: bool | None,
    limit: int | None,
) -> list[Note]:
    stmt = select(Note).where(Note.user_id == user_id)

    if query:
        q = f"%{query}%"
        stmt = stmt.where(or_(Note.title.ilike(q), Note.body.ilike(q)))

    if inboxed is not None:
        stmt = stmt.where(Note.inboxed == inboxed)

    if archived is not None:
        stmt = stmt.where(Note.archived == archived)

    include_all = False
    requested_tags: set[str] = set()
    if entity_types:
        for raw in entity_types:
            entity_type = raw.strip().lower()
            if entity_type == "note":
                include_all = True
                break
            mapped = _TAG_FILTER_MAP.get(entity_type)
            if mapped:
                requested_tags.add(mapped)

    if not include_all and requested_tags:
        stmt = (
            stmt.join(NoteTag, NoteTag.note_id == Note.id)
            .where(NoteTag.tag.in_(requested_tags))
            .distinct()
        )

    stmt = stmt.order_by(Note.updated_at.desc())

    if limit is not None:
        stmt = stmt.limit(limit)

    stmt = stmt.options(
        selectinload(Note.parent).selectinload(Note.fsrs_state),
        selectinload(Note.fsrs_state),
        selectinload(Note.tag_assignments),
        selectinload(Note.reviews),
    )

    result = await session.execute(stmt)
    return list(result.scalars().unique().all())


async def search_all(
    user_id: str,
    *,
    query: str | None = None,
    entity_types: list[str] | None = None,
    inboxed: bool | None = None,
    archived: bool | None = None,
    limit: int | None = None,
) -> list[SearchResultItem]:
    """Unified search across notes, ordered by recent activity."""
    session_factory = get_session_factory()

    async with session_factory() as session:
        notes = await _list_notes_for_search(
            session,
            user_id,
            query=query,
            entity_types=entity_types,
            inboxed=inboxed,
            archived=archived,
            limit=limit,
        )

    return [
        SearchResultItem(
            entity_type="note",
            note=note,
            recent_activity_at=note.updated_at,
        )
        for note in notes
    ]
