"""Topics HTTP endpoints - thin wrapper around service layer."""

from typing import Literal

from fastapi import APIRouter, Query

from app.constants import ChildHandlingStrategy
from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.schemas import (
    RelationshipDirection,
    ReviewSessionReadWithReviews,
    TopicChildRelationshipCreate,
    TopicCreate,
    TopicDetailRead,
    TopicOtherRelationshipCreate,
    TopicOtherRelationshipResponse,
    TopicRead,
    TopicRelatedRead,
    TopicRelationshipResponse,
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
    addable_to_review_session: int | None = None,
    addable_as_related_to: int | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[TopicSummaryRead]:
    return await service.search_topics(
        session,
        user_id,
        addable_as_parent_to=addable_as_parent_to,
        addable_as_child_to=addable_as_child_to,
        addable_to_review_session=addable_to_review_session,
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
    )


@router.get("/{topic_id}/")
async def read_topic(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> TopicDetailRead:
    return await service.load_topic_with_relationships(session, topic_id, user_id)


@router.get("/{topic_id}/children/")
async def read_topic_children(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> list[TopicSummaryRead]:
    return await service.get_topic_children(session, topic_id, user_id)


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
        assert payload.child is not None
        child_data = payload.child.model_dump()
        parent, child = await service.add_child(
            session,
            user_id,
            parent_id,
            child_name=child_data.get("name"),
            child_notes=child_data.get("notes"),
            child_srs_enabled=child_data.get("srs_enabled", False),
            child_inherit_fsrs=child_data.get("inherit_fsrs", False),
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
        assert relationship.to_topic is not None
        to_topic_data = relationship.to_topic.model_dump()
        from_topic, to_topic = await service.create_topic_relationship(
            session,
            user_id,
            from_topic_id,
            to_topic_name=to_topic_data.get("name"),
            to_topic_notes=to_topic_data.get("notes"),
            to_topic_srs_enabled=to_topic_data.get("srs_enabled", False),
        )
    return TopicOtherRelationshipResponse(from_topic=from_topic, to_topic=to_topic)


@router.delete("/{from_topic_id}/related/{to_topic_id}/")
async def delete_topic_other_relationship(
    from_topic_id: int,
    to_topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    await service.delete_topic_relationship(
        session, from_topic_id, to_topic_id, user_id
    )


@router.get("/{topic_id}/review-sessions/")
async def read_review_sessions_for_topic(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[ReviewSessionReadWithReviews]:
    return await service.get_review_sessions_for_topic(session, topic_id, user_id)


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
