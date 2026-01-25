"""Sources HTTP endpoints - thin wrapper around service layer."""

from typing import Literal

from fastapi import APIRouter, Query

from app.constants import ChildHandlingStrategy
from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.schemas import (
    EntityRelationCreate,
    SourceChildRelationshipCreate,
    SourceCreate,
    SourceDetailRead,
    SourcePrerequisiteCreate,
    SourcePrerequisiteRead,
    SourceRead,
    SourceRelationshipResponse,
    SourceSummaryRead,
    SourceTopicAdd,
    SourceTopicResponse,
    SourceUpdate,
    TopicSummaryRead,
)
from app.sources import service

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("/search/")
async def search_sources(
    session: SessionDep,
    user_id: UserIdDep,
    addable_as_parent_to: int | None = None,
    addable_as_child_to: int | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[SourceSummaryRead]:
    return await service.search_sources(
        session,
        user_id,
        addable_as_parent_to=addable_as_parent_to,
        addable_as_child_to=addable_as_child_to,
        query=query,
        limit=limit,
    )


@router.get("/")
async def read_sources(
    session: SessionDep,
    user_id: UserIdDep,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
    has_stability: bool | None = None,
    srs_enabled: bool | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[SourceSummaryRead]:
    return await service.list_sources(
        session,
        user_id,
        inboxed=inboxed,
        archived=archived,
        root=root,
        has_stability=has_stability,
        srs_enabled=srs_enabled,
        limit=limit,
        order=order,
    )


@router.get("/{source_id}/")
async def read_source(
    session: SessionDep, user_id: UserIdDep, source_id: int
) -> SourceDetailRead:
    return await service.load_source_with_relationships(session, source_id, user_id)


@router.get("/{source_id}/children/")
async def read_source_children(
    session: SessionDep, user_id: UserIdDep, source_id: int
) -> list[SourceSummaryRead]:
    return await service.get_source_children(session, source_id, user_id)


@router.get("/{source_id}/topics/")
async def read_source_topics(
    session: SessionDep, user_id: UserIdDep, source_id: int
) -> list[TopicSummaryRead]:
    return await service.get_source_topics(session, source_id, user_id)


@router.post("/")
async def insert_source(
    source: SourceCreate, session: SessionDep, user_id: UserIdDep
) -> SourceRead:
    source_data = source.model_dump()
    return await service.create_source(session, user_id, **source_data)


@router.post("/{parent_id}/children/")
async def insert_child(
    parent_id: int,
    payload: SourceChildRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> SourceRelationshipResponse:
    if payload.child_id is not None:
        parent, child = await service.add_child(
            session, user_id, parent_id, child_id=payload.child_id
        )
    else:
        assert payload.child is not None
        child_data = payload.child.model_dump()
        parent, child = await service.add_child(
            session,
            user_id,
            parent_id,
            child_title=child_data.get("title"),
            child_notes=child_data.get("notes"),
            child_srs_enabled=child_data.get("srs_enabled", False),
            child_inherit_fsrs=child_data.get("inherit_fsrs", False),
        )
    return SourceRelationshipResponse(parent=parent, child=child)


@router.delete("/{parent_id}/children/{child_id}/")
async def delete_child(
    parent_id: int,
    child_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> SourceDetailRead:
    return await service.remove_child(session, parent_id, child_id, user_id)


@router.post("/{source_id}/topics/")
async def add_source_topic(
    source_id: int,
    payload: SourceTopicAdd,
    session: SessionDep,
    user_id: UserIdDep,
) -> SourceTopicResponse:
    source, topic = await service.add_source_topic(
        session, source_id, payload.topic_id, user_id
    )
    return SourceTopicResponse(source=source, topic=topic)


@router.delete("/{source_id}/topics/{topic_id}/")
async def remove_source_topic(
    source_id: int,
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    await service.remove_source_topic(session, source_id, topic_id, user_id)


@router.post("/{source_id}/entity-relations/")
async def add_entity_relation_to_source(
    source_id: int,
    payload: EntityRelationCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    """Add a related entity (topic or source) to this source."""
    await service.add_related_entity_to_source(
        session,
        source_id,
        user_id,
        to_entity_type=payload.to_entity_type.value,
        to_entity_id=payload.to_entity_id,
    )


@router.delete("/{source_id}/entity-relations/{entity_type}/{entity_id}/")
async def remove_entity_relation_from_source(
    source_id: int,
    entity_type: str,
    entity_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    """Remove a related entity (topic or source) from this source."""
    await service.remove_related_entity_from_source(
        session,
        source_id,
        user_id,
        entity_type=entity_type,
        entity_id=entity_id,
    )


@router.get("/{source_id}/prerequisites/")
async def read_source_prerequisites(
    source_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[SourcePrerequisiteRead]:
    """Get all prerequisites for a source."""
    return await service.get_source_prerequisites(session, source_id, user_id)


@router.post("/{source_id}/prerequisites/")
async def add_source_prerequisite(
    source_id: int,
    payload: SourcePrerequisiteCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    """Add a prerequisite (topic or source) to this source."""
    await service.add_source_prerequisite(
        session,
        source_id,
        user_id,
        prereq_entity_type=payload.prereq_entity_type.value,
        prereq_entity_id=payload.prereq_entity_id,
    )


@router.delete("/{source_id}/prerequisites/{entity_type}/{entity_id}/")
async def remove_source_prerequisite(
    source_id: int,
    entity_type: str,
    entity_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    """Remove a prerequisite (topic or source) from this source."""
    await service.remove_source_prerequisite(
        session,
        source_id,
        user_id,
        entity_type=entity_type,
        entity_id=entity_id,
    )


@router.patch("/{source_id}/")
async def update_source(
    source_id: int, payload: SourceUpdate, session: SessionDep, user_id: UserIdDep
) -> SourceDetailRead:
    update_data = payload.model_dump(exclude_unset=True)

    # Convert to service function kwargs
    kwargs = {}
    if "title" in update_data:
        kwargs["title"] = update_data["title"]
    if "notes" in update_data:
        kwargs["notes"] = update_data["notes"]
    if "parent_id" in update_data:
        kwargs["parent_id"] = update_data["parent_id"]
    if "srs_enabled" in update_data:
        kwargs["srs_enabled"] = update_data["srs_enabled"]
    if "inboxed" in update_data:
        kwargs["inboxed"] = update_data["inboxed"]
    if "archived" in update_data:
        kwargs["archived"] = update_data["archived"]

    return await service.update_source(session, source_id, user_id, **kwargs)


@router.delete("/{source_id}/")
async def delete_source(
    source_id: int,
    session: SessionDep,
    user_id: UserIdDep,
    handle_children_by: ChildHandlingStrategy | None = Query(default=None),
):
    await service.delete_source(
        session, source_id, user_id, handle_children_by=handle_children_by
    )
