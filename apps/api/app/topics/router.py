"""Topics HTTP endpoints - thin wrapper around service layer."""

from typing import Literal

from fastapi import APIRouter, Query

from app.constants import ChildHandlingStrategy
from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.schemas import (
    ConvertToPracticeResponse,
    ConvertToSourceResponse,
    EntityRelationsRead,
    EntityRelationCreate,
    PracticeSummaryRead,
    RelationshipDirection,
    SourceTopicResponse,
    SourceSummaryRead,
    TopicChildRelationshipCreate,
    TopicCreate,
    TopicDetailRead,
    TopicOtherRelationshipCreate,
    TopicOtherRelationshipResponse,
    TopicParentRelationshipCreate,
    TopicPracticeAdd,
    TopicRead,
    TopicRelatedRead,
    TopicRelationshipResponse,
    TopicSourceAdd,
    TopicSummaryRead,
    TopicUpdate,
)
from app.topics import service

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/search/")
async def search_topics(
    session: SessionDep,
    user_id: UserIdDep,
    addable_as_parent_to: int | None = None,
    addable_as_child_to: int | None = None,
    addable_as_related_to: int | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[TopicSummaryRead]:
    return await service.search_topics(
        session,
        user_id,
        addable_as_parent_to=addable_as_parent_to,
        addable_as_child_to=addable_as_child_to,
        addable_as_related_to=addable_as_related_to,
        query=query,
        limit=limit,
    )


@router.get("/")
async def read_topics(
    session: SessionDep,
    user_id: UserIdDep,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
    has_stability: bool | None = None,
    srs_enabled: bool | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
    order_by: Literal["updated_at", "recent_activity"] = "updated_at",
) -> list[TopicSummaryRead]:
    return await service.list_topics(
        session,
        user_id,
        inboxed=inboxed,
        archived=archived,
        root=root,
        has_stability=has_stability,
        srs_enabled=srs_enabled,
        limit=limit,
        order=order,
        order_by=order_by,
    )


@router.get("/{topic_id}/")
async def read_topic(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> TopicSummaryRead:
    return TopicSummaryRead.model_validate(
        await service.get_topic(session, topic_id, user_id)
    )


@router.get("/{topic_id}/children/")
async def read_topic_children(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> list[TopicSummaryRead]:
    return await service.get_topic_children(session, topic_id, user_id)


@router.get("/{topic_id}/sources/")
async def read_topic_sources(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> list[SourceSummaryRead]:
    return await service.get_topic_sources(session, topic_id, user_id)


@router.get("/{topic_id}/entity-relations/")
async def read_topic_entity_relations(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> EntityRelationsRead:
    outgoing, incoming = await service.get_topic_related_entities(
        session, topic_id, user_id
    )
    return EntityRelationsRead(outgoing=outgoing, incoming=incoming)


@router.get("/{topic_id}/related/")
async def read_topic_related(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> list[TopicRelatedRead]:
    outgoing_topics, incoming_topics = await service.get_topic_related(
        session, topic_id, user_id
    )

    results = []
    for t in outgoing_topics:
        t_data = TopicRead.model_validate(t).model_dump()
        t_data["relationship_direction"] = RelationshipDirection.OUTGOING
        results.append(TopicRelatedRead(**t_data))

    for t in incoming_topics:
        t_data = TopicRead.model_validate(t).model_dump()
        t_data["relationship_direction"] = RelationshipDirection.INCOMING
        results.append(TopicRelatedRead(**t_data))

    return results


@router.post("/")
async def insert_topic(
    topic: TopicCreate, session: SessionDep, user_id: UserIdDep
) -> TopicRead:
    topic_data = topic.model_dump()
    return await service.create_topic(session, user_id, **topic_data)


@router.post("/{parent_id}/children/")
async def insert_child(
    parent_id: int,
    payload: TopicChildRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicRelationshipResponse:
    if payload.child_id is not None:
        parent, child = await service.add_child(
            session, user_id, parent_id, child_id=payload.child_id
        )
    else:
        child_data = payload.child.model_dump()
        parent, child = await service.add_child(
            session,
            user_id,
            parent_id,
            child_name=child_data.get("name"),
            child_notes=child_data.get("notes"),
            child_srs_enabled=child_data.get("srs_enabled", False),
            child_inherit_fsrs=child_data.get("inherit_fsrs", False),
            child_inboxed=child_data.get("inboxed", False),
            child_archived=child_data.get("archived", False),
        )
    return TopicRelationshipResponse(parent=parent, child=child)


@router.post("/{topic_id}/parent/")
async def set_parent(
    topic_id: int,
    payload: TopicParentRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicRelationshipResponse:
    if payload.parent_id is not None:
        parent, child = await service.set_topic_parent(
            session, user_id, topic_id, parent_id=payload.parent_id
        )
    else:
        parent_data = payload.parent.model_dump()
        parent, child = await service.set_topic_parent(
            session, user_id, topic_id, parent_data=parent_data
        )
    return TopicRelationshipResponse(parent=parent, child=child)


@router.delete("/{parent_id}/children/{child_id}/")
async def delete_child(
    parent_id: int,
    child_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicDetailRead:
    return await service.remove_child(session, parent_id, child_id, user_id)


@router.post("/{from_topic_id}/related/")
async def create_topic_other_relationship(
    from_topic_id: int,
    relationship: TopicOtherRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicOtherRelationshipResponse:
    if relationship.to_topic_id is not None:
        from_topic, to_topic = await service.create_topic_relationship(
            session, user_id, from_topic_id, to_topic_id=relationship.to_topic_id
        )
    else:
        to_topic_data = relationship.to_topic.model_dump()
        from_topic, to_topic = await service.create_topic_relationship(
            session,
            user_id,
            from_topic_id,
            to_topic_data=to_topic_data,
        )
    return TopicOtherRelationshipResponse(from_topic=from_topic, to_topic=to_topic)


@router.delete("/{from_topic_id}/related/{to_topic_id}/")
async def delete_topic_other_relationship(
    from_topic_id: int,
    to_topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    """Delete a topic-to-topic relationship (legacy endpoint for backward compatibility)."""
    await service.delete_topic_relationship(
        session, from_topic_id, to_topic_id, user_id
    )


@router.post("/{topic_id}/entity-relations/")
async def add_entity_relation_to_topic(
    topic_id: int,
    payload: EntityRelationCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    """Add a related entity (topic or source) to this topic."""
    await service.add_related_entity_to_topic(
        session,
        topic_id,
        user_id,
        to_entity_type=payload.to_entity_type.value,
        to_entity_id=payload.to_entity_id,
        to_topic_data=payload.to_topic.model_dump() if payload.to_topic else None,
        to_source_data=payload.to_source.model_dump() if payload.to_source else None,
    )


@router.delete("/{topic_id}/entity-relations/{entity_type}/{entity_id}/")
async def remove_entity_relation_from_topic(
    topic_id: int,
    entity_type: str,
    entity_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    """Remove a related entity (topic or source) from this topic."""
    await service.remove_related_entity_from_topic(
        session,
        topic_id,
        user_id,
        entity_type=entity_type,
        entity_id=entity_id,
    )


@router.get("/{topic_id}/practices/")
async def get_topic_practices(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int,
) -> list[PracticeSummaryRead]:
    """Get all practices linked to a topic."""
    practices = await service.get_topic_practices(session, topic_id, user_id)
    return [PracticeSummaryRead.model_validate(p) for p in practices]


@router.post("/{topic_id}/practices/", status_code=201)
async def add_practice_to_topic(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int,
    data: TopicPracticeAdd,
) -> None:
    """Link a practice to a topic."""
    if data.practice_id is not None:
        await service.add_practice_to_topic(
            session, topic_id, user_id, practice_id=data.practice_id
        )
    else:
        await service.add_practice_to_topic(
            session,
            topic_id,
            user_id,
            practice_data=data.practice.model_dump(),
        )


@router.delete("/{topic_id}/practices/{practice_id}/", status_code=204)
async def remove_practice_from_topic(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int,
    practice_id: int,
) -> None:
    """Remove a practice link from a topic."""
    await service.remove_practice_from_topic(session, topic_id, practice_id, user_id)


@router.post("/{topic_id}/sources/", status_code=201)
async def add_source_to_topic(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int,
    data: TopicSourceAdd,
) -> SourceTopicResponse:
    from app.sources.service import add_source_topic

    if data.source_id is not None:
        source, topic = await add_source_topic(
            session, user_id, source_id=data.source_id, topic_id=topic_id
        )
    else:
        source, topic = await add_source_topic(
            session, user_id, source_data=data.source.model_dump(), topic_id=topic_id
        )
    return SourceTopicResponse(source=source, topic=topic)


@router.patch("/{topic_id}/")
async def update_topic(
    topic_id: int, payload: TopicUpdate, session: SessionDep, user_id: UserIdDep
) -> TopicDetailRead:
    update_data = payload.model_dump(exclude_unset=True)

    # Convert to service function kwargs
    kwargs = {}
    if "name" in update_data:
        kwargs["name"] = update_data["name"]
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

    return await service.update_topic(session, topic_id, user_id, **kwargs)


@router.delete("/{topic_id}/")
async def delete_topic(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
    handle_children_by: ChildHandlingStrategy | None = Query(default=None),
):
    await service.delete_topic(
        session, topic_id, user_id, handle_children_by=handle_children_by
    )


@router.post("/{topic_id}/convert-to-source/")
async def convert_topic_to_source_endpoint(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> ConvertToSourceResponse:
    """Convert a topic and its subtree to sources.

    Returns the new root source ID.
    Fails with 409 if any topic in subtree has sources covering it.
    """
    new_source_id = await service.convert_topic_to_source(session, topic_id, user_id)
    return ConvertToSourceResponse(source_id=new_source_id)


@router.post("/{topic_id}/convert-to-practice/")
async def convert_topic_to_practice_endpoint(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> ConvertToPracticeResponse:
    """Convert a topic to a practice.

    Returns the new practice ID.
    Fails with 409 if topic has practices or sources covering it.
    """
    new_practice_id = await service.convert_topic_to_practice(
        session, topic_id, user_id
    )
    return ConvertToPracticeResponse(practice_id=new_practice_id)
