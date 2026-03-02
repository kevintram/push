"""Notes HTTP endpoints - thin wrapper around service layer."""

from typing import Literal

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.schemas.notes import (
    NoteCreate,
    NoteRead,
    NoteRelationCreate,
    NoteRelationListItem,
    NoteRelationRead,
    NoteRelationTypeEnum,
    NoteTagCreate,
    NoteTagEnum,
    NoteUpdate,
    RelationDirectionEnum,
)
from app.notes import service

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/")
async def read_notes(
    session: SessionDep,
    user_id: UserIdDep,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
    parent_id: int | None = None,
    tag: NoteTagEnum | None = None,
    srs_enabled: bool | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[NoteRead]:
    return await service.list_notes(
        session,
        user_id,
        inboxed=inboxed,
        archived=archived,
        root=root,
        parent_id=parent_id,
        tag=tag.value if tag else None,
        srs_enabled=srs_enabled,
        limit=limit,
        order=order,
    )


@router.get("/{note_id}/")
async def read_note(
    session: SessionDep,
    user_id: UserIdDep,
    note_id: int,
) -> NoteRead:
    return await service.get_note(session, note_id, user_id)


@router.post("/", status_code=201)
async def insert_note(
    payload: NoteCreate, session: SessionDep, user_id: UserIdDep
) -> NoteRead:
    data = payload.model_dump()
    tags = [tag.value for tag in data.pop("tags", [])]
    return await service.create_note(session, user_id, tags=tags, **data)


@router.patch("/{note_id}/")
async def update_note(
    note_id: int,
    payload: NoteUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> NoteRead:
    updates = payload.model_dump(exclude_unset=True)
    return await service.update_note(session, note_id, user_id, updates=updates)


@router.delete("/{note_id}/", status_code=204)
async def delete_note(
    note_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    await service.delete_note(session, note_id, user_id)


@router.get("/{note_id}/tags/")
async def read_note_tags(
    note_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[NoteTagEnum]:
    tags = await service.list_note_tags(session, note_id, user_id)
    return [NoteTagEnum(tag.tag) for tag in tags]


@router.post("/{note_id}/tags/", status_code=201)
async def add_note_tag(
    note_id: int,
    payload: NoteTagCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[NoteTagEnum]:
    await service.add_note_tag(session, note_id, user_id, tag=payload.tag.value)
    tags = await service.list_note_tags(session, note_id, user_id)
    return [NoteTagEnum(tag.tag) for tag in tags]


@router.delete("/{note_id}/tags/{tag}/", status_code=204)
async def remove_note_tag(
    note_id: int,
    tag: NoteTagEnum,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    await service.remove_note_tag(session, note_id, user_id, tag=tag.value)


@router.get("/{note_id}/relations/")
async def read_note_relations(
    note_id: int,
    session: SessionDep,
    user_id: UserIdDep,
    relation_type: NoteRelationTypeEnum | None = None,
    direction: RelationDirectionEnum = RelationDirectionEnum.OUTGOING,
) -> list[NoteRelationListItem]:
    relations = await service.list_note_relations(
        session,
        note_id,
        user_id,
        relation_type=relation_type.value if relation_type else None,
        direction=direction.value,
    )
    items: list[NoteRelationListItem] = []
    for relation in relations:
        relation_payload = NoteRelationRead.model_validate(relation).model_dump()
        items.append(
            NoteRelationListItem(
                **relation_payload,
                direction=direction,
            )
        )
    return items


@router.post("/{note_id}/relations/", status_code=201)
async def add_note_relation(
    note_id: int,
    payload: NoteRelationCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> NoteRelationRead:
    relation = await service.add_note_relation(
        session,
        note_id,
        user_id,
        to_id=payload.to_id,
        relation_type=payload.relation_type.value,
    )
    return NoteRelationRead.model_validate(relation)


@router.delete("/{note_id}/relations/{relation_type}/{other_note_id}/", status_code=204)
async def remove_note_relation(
    note_id: int,
    relation_type: NoteRelationTypeEnum,
    other_note_id: int,
    session: SessionDep,
    user_id: UserIdDep,
    direction: RelationDirectionEnum = RelationDirectionEnum.OUTGOING,
) -> None:
    await service.remove_note_relation(
        session,
        note_id,
        user_id,
        other_note_id=other_note_id,
        relation_type=relation_type.value,
        direction=direction.value,
    )
