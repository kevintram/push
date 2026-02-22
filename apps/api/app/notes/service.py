"""Notes business logic and data access."""

from typing import Literal

from sqlalchemy import delete, desc, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import AlreadyExistsError, BadRequestError, NotFoundError
from app.models import FsrsState, Note, NoteRelation, NoteTag


async def get_note(session: AsyncSession, note_id: int, user_id: str) -> Note:
    stmt = (
        select(Note)
        .where(Note.id == note_id, Note.user_id == user_id)
        .options(
            selectinload(Note.parent).selectinload(Note.fsrs_state),
            selectinload(Note.fsrs_state),
            selectinload(Note.tag_assignments),
            selectinload(Note.reviews),
        )
    )
    result = await session.execute(stmt)
    note = result.scalar_one_or_none()
    if not note:
        raise NotFoundError("Note", note_id)
    return note


async def is_descendant_of(
    session: AsyncSession, potential_descendant_id: int, ancestor_id: int
) -> bool:
    result = await session.execute(
        text("""
            SELECT EXISTS (
                SELECT 1 FROM notes d, notes a
                WHERE d.id = :descendant_id
                  AND a.id = :ancestor_id
                  AND d.path <@ a.path
            )
        """),
        {"descendant_id": potential_descendant_id, "ancestor_id": ancestor_id},
    )
    return bool(result.scalar())


async def list_notes(
    session: AsyncSession,
    user_id: str,
    *,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
    parent_id: int | None = None,
    in_reading_list: bool | None = None,
    reading_status: str | None = None,
    tag: str | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[Note]:
    stmt = select(Note).where(Note.user_id == user_id)

    if inboxed is not None:
        stmt = stmt.where(Note.inboxed == inboxed)
    if archived is not None:
        stmt = stmt.where(Note.archived == archived)
    if root is True:
        stmt = stmt.where(Note.parent_id.is_(None))
    if parent_id is not None:
        stmt = stmt.where(Note.parent_id == parent_id)
    if in_reading_list is not None:
        stmt = stmt.where(Note.in_reading_list == in_reading_list)
    if reading_status is not None:
        stmt = stmt.where(Note.reading_status == reading_status)
    if tag is not None:
        stmt = stmt.join(NoteTag, NoteTag.note_id == Note.id).where(NoteTag.tag == tag)

    if order == "asc":
        stmt = stmt.order_by(Note.updated_at.asc())
    else:
        stmt = stmt.order_by(desc(Note.updated_at))

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


async def create_note(
    session: AsyncSession,
    user_id: str,
    *,
    title: str = "",
    body: str = "",
    parent_id: int | None = None,
    reading_status: str = "NEW",
    reading_notes: str = "",
    in_reading_list: bool = False,
    archived: bool = False,
    inboxed: bool = False,
    tags: list[str] | None = None,
    srs_enabled: bool = True,
) -> Note:
    if parent_id is not None:
        await get_note(session, parent_id, user_id)

    note = Note(
        user_id=user_id,
        title=title,
        body=body,
        parent_id=parent_id,
        reading_status=reading_status,
        reading_notes=reading_notes,
        in_reading_list=in_reading_list,
        archived=archived,
        inboxed=inboxed,
    )

    if srs_enabled:
        fsrs_state = FsrsState(srs_enabled=True)
        session.add(fsrs_state)
        await session.flush()
        note.fsrs_state_id = fsrs_state.id

    session.add(note)
    await session.flush()

    for tag in sorted(set(tags or [])):
        session.add(NoteTag(note_id=note.id, tag=tag))

    await session.flush()
    return await get_note(session, note.id, user_id)


async def update_note(
    session: AsyncSession,
    note_id: int,
    user_id: str,
    *,
    updates: dict,
) -> Note:
    note = await get_note(session, note_id, user_id)

    if "parent_id" in updates:
        parent_id = updates["parent_id"]
        if parent_id is not None:
            if parent_id == note_id:
                raise BadRequestError("Cannot set note as its own parent")
            await get_note(session, parent_id, user_id)
            if await is_descendant_of(session, parent_id, note_id):
                raise BadRequestError("Cannot set parent: would create a cycle")
        note.parent_id = parent_id

    if "title" in updates and updates["title"] is not None:
        note.title = updates["title"]
    if "body" in updates and updates["body"] is not None:
        note.body = updates["body"]
    if "reading_status" in updates and updates["reading_status"] is not None:
        note.reading_status = updates["reading_status"]
    if "reading_notes" in updates and updates["reading_notes"] is not None:
        note.reading_notes = updates["reading_notes"]
    if "in_reading_list" in updates and updates["in_reading_list"] is not None:
        note.in_reading_list = updates["in_reading_list"]
    if "archived" in updates and updates["archived"] is not None:
        note.archived = updates["archived"]
    if "inboxed" in updates and updates["inboxed"] is not None:
        note.inboxed = updates["inboxed"]

    if "srs_enabled" in updates and updates["srs_enabled"] is not None:
        srs_enabled = updates["srs_enabled"]
        if note.fsrs_state is None:
            fsrs_state = FsrsState(srs_enabled=srs_enabled)
            session.add(fsrs_state)
            await session.flush()
            note.fsrs_state_id = fsrs_state.id
            note.fsrs_state = fsrs_state
        else:
            note.fsrs_state.srs_enabled = srs_enabled

    await session.flush()
    return await get_note(session, note_id, user_id)


async def delete_note(session: AsyncSession, note_id: int, user_id: str) -> None:
    note = await get_note(session, note_id, user_id)
    try:
        async with session.begin_nested():
            await session.delete(note)
            await session.flush()
    except IntegrityError as exc:
        raise BadRequestError(
            "Cannot delete note with children. Re-parent or delete children first."
        ) from exc


async def list_note_tags(
    session: AsyncSession, note_id: int, user_id: str
) -> list[NoteTag]:
    await get_note(session, note_id, user_id)
    result = await session.execute(select(NoteTag).where(NoteTag.note_id == note_id))
    return list(result.scalars().all())


async def add_note_tag(
    session: AsyncSession, note_id: int, user_id: str, *, tag: str
) -> NoteTag:
    await get_note(session, note_id, user_id)
    note_tag = NoteTag(note_id=note_id, tag=tag)
    try:
        async with session.begin_nested():
            session.add(note_tag)
            await session.flush()
    except IntegrityError as exc:
        raise AlreadyExistsError("Tag already exists on this note") from exc
    return note_tag


async def remove_note_tag(
    session: AsyncSession, note_id: int, user_id: str, *, tag: str
) -> None:
    await get_note(session, note_id, user_id)
    try:
        async with session.begin_nested():
            result = await session.execute(
                delete(NoteTag).where(NoteTag.note_id == note_id, NoteTag.tag == tag)
            )
    except IntegrityError as exc:
        raise BadRequestError(
            "Cannot remove this tag while existing relations depend on it"
        ) from exc
    if result.rowcount == 0:
        raise NotFoundError("Note tag")


async def _validate_relation_tag_rules(
    session: AsyncSession, *, from_note_id: int, to_note_id: int, relation_type: str
) -> None:
    if relation_type == "COVERS":
        stmt = select(NoteTag).where(
            NoteTag.note_id == from_note_id,
            NoteTag.tag == "SOURCE",
        )
        if (await session.execute(stmt)).scalar_one_or_none() is None:
            raise BadRequestError("COVERS requires from_id note to have SOURCE tag")
        to_stmt = select(NoteTag).where(
            NoteTag.note_id == to_note_id,
            NoteTag.tag == "TOPIC",
        )
        if (await session.execute(to_stmt)).scalar_one_or_none() is None:
            raise BadRequestError("COVERS requires to_id note to have TOPIC tag")
    if relation_type == "ASSESSES":
        stmt = select(NoteTag).where(
            NoteTag.note_id == from_note_id,
            NoteTag.tag == "PRACTICE",
        )
        if (await session.execute(stmt)).scalar_one_or_none() is None:
            raise BadRequestError("ASSESSES requires from_id note to have PRACTICE tag")
        to_stmt = select(NoteTag).where(
            NoteTag.note_id == to_note_id,
            NoteTag.tag.in_(["TOPIC", "SOURCE"]),
        )
        if (await session.execute(to_stmt)).scalar_one_or_none() is None:
            raise BadRequestError(
                "ASSESSES requires to_id note to have TOPIC or SOURCE tag"
            )


async def list_note_relations(
    session: AsyncSession,
    note_id: int,
    user_id: str,
    *,
    relation_type: str | None = None,
    direction: str = "outgoing",
) -> list[NoteRelation]:
    await get_note(session, note_id, user_id)

    stmt = select(NoteRelation)
    if direction == "incoming":
        stmt = stmt.where(NoteRelation.to_id == note_id)
    else:
        stmt = stmt.where(NoteRelation.from_id == note_id)

    if relation_type is not None:
        stmt = stmt.where(NoteRelation.relation_type == relation_type)

    stmt = stmt.order_by(NoteRelation.inserted_at.desc())

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def add_note_relation(
    session: AsyncSession,
    note_id: int,
    user_id: str,
    *,
    to_id: int,
    relation_type: str,
) -> NoteRelation:
    await get_note(session, note_id, user_id)
    await get_note(session, to_id, user_id)
    await _validate_relation_tag_rules(
        session, from_note_id=note_id, to_note_id=to_id, relation_type=relation_type
    )

    relation = NoteRelation(
        from_id=note_id,
        to_id=to_id,
        relation_type=relation_type,
    )
    try:
        async with session.begin_nested():
            session.add(relation)
            await session.flush()
    except IntegrityError as exc:
        raise AlreadyExistsError("Relation already exists") from exc
    return relation


async def remove_note_relation(
    session: AsyncSession,
    note_id: int,
    user_id: str,
    *,
    other_note_id: int,
    relation_type: str,
    direction: str = "outgoing",
) -> None:
    await get_note(session, note_id, user_id)
    await get_note(session, other_note_id, user_id)

    if direction == "incoming":
        from_id = other_note_id
        to_id = note_id
    else:
        from_id = note_id
        to_id = other_note_id

    result = await session.execute(
        delete(NoteRelation).where(
            NoteRelation.from_id == from_id,
            NoteRelation.to_id == to_id,
            NoteRelation.relation_type == relation_type,
        )
    )
    if result.rowcount == 0:
        raise NotFoundError("Note relation")
