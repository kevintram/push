from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone as dt_timezone, date

from sqlalchemy import or_, select, update, delete, desc, insert
from app.utils.retrievability import calculate_retrievability
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import Literal

from app.dependencies import SessionDep, UserIdDep
from app.models import Topic, t_topics_closure, t_topic_other_relations, ReviewSession, Review
from app.schemas import (
    TopicRead,
    TopicCreate,
    TopicUpdate,
    TopicReadWithRelationships,
    TopicChildRelationshipCreate,
    TopicParentRelationshipCreate,
    TopicRelationshipResponse,
    TopicOtherRelationshipCreate,
    TopicOtherRelationshipResponse,
    ReviewSessionReadWithReviews,
    TopicRelatedRead,
    RelationshipDirection,
)

router = APIRouter()


async def _insert_topic_relationship(
    session: AsyncSession,
    *,
    user_id: str,
    parent_id: int,
    child_id: int,
    focus_topic_id: int,
) -> Topic:
    if parent_id == child_id:
        raise HTTPException(
            status_code=400, detail="Parent and child must be different topics"
        )

    topics_result = await session.execute(
        select(Topic.id).where(
            Topic.user_id == user_id,
            Topic.id.in_([parent_id, child_id]),
        )
    )
    topic_ids = set(topics_result.scalars())

    if parent_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Parent topic not found")
    if child_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Child topic not found")

    # Check if relationship already exists
    relationship_result = await session.execute(
        select(t_topics_closure.c.ancestor).where(
            t_topics_closure.c.ancestor == parent_id,
            t_topics_closure.c.descendant == child_id,
            t_topics_closure.c.depth == 1,
        )
    )
    if relationship_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Relationship already exists")

    conn = await session.connection()
    raw_conn = await conn.get_raw_connection()
    inserted_rows = await raw_conn.driver_connection.fetch(
        "SELECT * FROM insert_relationship($1, $2)", parent_id, child_id
    )

    if not inserted_rows:
        raise HTTPException(
            status_code=400,
            detail="Relationship already exists or would create a cycle",
        )

    refreshed_topic = await session.execute(
        select(Topic)
        .where(Topic.id == focus_topic_id, Topic.user_id == user_id)
        .options(
            selectinload(Topic.parents),
            selectinload(Topic.children),
        )
    )
    topic = refreshed_topic.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic


async def _delete_topic_relationship(
    session: AsyncSession,
    *,
    user_id: str,
    parent_id: int,
    child_id: int,
    focus_topic_id: int,
) -> Topic:
    if parent_id == child_id:
        raise HTTPException(
            status_code=400, detail="Parent and child must be different topics"
        )

    topics_result = await session.execute(
        select(Topic.id).where(
            Topic.user_id == user_id,
            Topic.id.in_([parent_id, child_id]),
        )
    )
    topic_ids = set(topics_result.scalars())

    if parent_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Parent topic not found")
    if child_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Child topic not found")

    relationship_result = await session.execute(
        select(t_topics_closure.c.ancestor).where(
            t_topics_closure.c.ancestor == parent_id,
            t_topics_closure.c.descendant == child_id,
            t_topics_closure.c.depth == 1,
        )
    )
    relationship_exists = relationship_result.scalar_one_or_none()

    if relationship_exists is None:
        raise HTTPException(status_code=404, detail="Relationship not found")

    conn = await session.connection()

    raw_conn = await conn.get_raw_connection()
    deleted_rows = await raw_conn.driver_connection.fetch(
        "SELECT * FROM delete_relationship($1, $2)", parent_id, child_id
    )

    if not deleted_rows:
        raise HTTPException(status_code=404, detail="Relationship not found")

    refreshed_topic = await session.execute(
        select(Topic)
        .where(Topic.id == focus_topic_id, Topic.user_id == user_id)
        .options(
            selectinload(Topic.parents),
            selectinload(Topic.children),
        )
    )
    topic = refreshed_topic.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic


@router.get("/topics/search/", tags=["topics"])
async def search_topics(
    session: SessionDep,
    user_id: UserIdDep,
    addable_as_parent_to: int | None = None,
    addable_as_child_to: int | None = None,
    addable_to_review_session: int | None = None,
    addable_as_related_to: int | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[TopicReadWithRelationships]:
    cleaned_query = query.strip() if query else ""
    stmt = select(Topic).where(Topic.user_id == user_id)

    if addable_as_related_to is not None:
        # 1. Exclude the topic itself
        stmt = stmt.where(Topic.id != addable_as_related_to)

        # 2. Exclude already related topics (bidirectional)
        outgoing = select(t_topic_other_relations.c.to_topic_id).where(
            t_topic_other_relations.c.from_topic_id == addable_as_related_to
        )
        incoming = select(t_topic_other_relations.c.from_topic_id).where(
            t_topic_other_relations.c.to_topic_id == addable_as_related_to
        )
        # Use union of selects for exclusion
        already_related = outgoing.union(incoming)
        
        stmt = stmt.where(Topic.id.notin_(already_related))

    if addable_as_parent_to is not None:
        # filter out all topics that can't be parents to addable_as_parent_to

        # 1. filter out addable_as_parent_to's descendants (if add a descendant as parent, it will create a cycle)
        descendants = select(t_topics_closure.c.descendant).where(
            t_topics_closure.c.ancestor == addable_as_parent_to
        )
        stmt = stmt.where(Topic.id.notin_(descendants))

        # 2. filter out addable_as_parent_to's parents (don't want to add a topic that's already a parent)
        parents = select(t_topics_closure.c.ancestor).where(
            t_topics_closure.c.descendant == addable_as_parent_to,
            t_topics_closure.c.depth == 1,
        )
        stmt = stmt.where(Topic.id.notin_(parents))
    if addable_as_child_to is not None:
        # filter out all topics that can't be children to addable_as_child_to

        # 1. filter out addable_as_child_to's ancestors (if add an ancestor as child, it will create a cycle)
        ancestors = select(t_topics_closure.c.ancestor).where(
            t_topics_closure.c.descendant == addable_as_child_to
        )
        stmt = stmt.where(Topic.id.notin_(ancestors))

        # 2. filter out addable_as_child_to's children (don't want to add a topic that's already a child)
        children = select(t_topics_closure.c.descendant).where(
            t_topics_closure.c.ancestor == addable_as_child_to,
            t_topics_closure.c.depth == 1,
        )
        stmt = stmt.where(Topic.id.notin_(children))
    if addable_to_review_session is not None:
        # filter out all topics that can't be added to addable_to_review_session
        # filter out addable_to_review_session's topics (don't want to add a topic that's already a topic)
        topics = select(Review.topic_id).where(
            Review.review_session_id == addable_to_review_session
        )
        stmt = stmt.where(Topic.id.notin_(topics))

    if cleaned_query:
        like_pattern = f"%{cleaned_query}%"
        stmt = stmt.where(
            or_(
                Topic.name.ilike(like_pattern),
                Topic.notes.ilike(like_pattern),
            )
        )
        stmt = stmt.order_by(Topic.name.asc())
    else:
        stmt = stmt.order_by(Topic.updated_at.desc())

    limit = max(1, min(limit, 50))
    stmt = stmt.limit(limit)
    stmt = stmt.options(
        selectinload(Topic.parents),
        selectinload(Topic.children),
    )

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/topics/", tags=["topics"])
async def read_topics(
    session: SessionDep,
    user_id: UserIdDep,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
    has_stability: bool | None = None,
    srs_enabled: bool | None = None,
    scheduled: bool | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[dict]:
    stmt = select(Topic).where(Topic.user_id == user_id)

    # Apply ordering
    if order == "desc":
        stmt = stmt.order_by(desc(Topic.updated_at))
    else:
        stmt = stmt.order_by(Topic.updated_at)
    if inboxed is not None:
        stmt = stmt.where(Topic.inboxed == inboxed)
    if archived is not None:
        stmt = stmt.where(Topic.archived == archived)
    if srs_enabled is not None:
        stmt = stmt.where(Topic.srs_enabled == srs_enabled)
    if scheduled is not None:
        if scheduled:
            stmt = stmt.where(Topic.scheduled_at.isnot(None))
        else:
            stmt = stmt.where(Topic.scheduled_at.is_(None))

    if root is not None and root is True:
        topics_with_ancestors = select(t_topics_closure.c.descendant).where(
            t_topics_closure.c.depth > 0
        )
        stmt = stmt.where(Topic.id.notin_(topics_with_ancestors))

    if has_stability is not None:
        if has_stability:
            stmt = stmt.where(Topic.stability.isnot(None))
        else:
            stmt = stmt.where(Topic.stability.is_(None))

    stmt = stmt.options(
        selectinload(Topic.parents),
        selectinload(Topic.children),
    )

    # Apply limit if provided
    if limit is not None:
        stmt = stmt.limit(limit)

    result = await session.execute(stmt)
    topics = result.scalars().all()

    # Compute retrievability for each topic
    current_date = date.today()
    topics_with_retrievability = []
    for topic in topics:
        topic_dict = TopicReadWithRelationships.model_validate(topic).model_dump()
        topic_dict["retrievability"] = calculate_retrievability(
            topic.stability, topic.last_reviewed_at, current_date
        )
        topics_with_retrievability.append(topic_dict)

    return topics_with_retrievability


@router.get("/topics/{topic_id}/", tags=["topics"])
async def read_topic(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> dict:
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    stmt = stmt.options(
        selectinload(Topic.parents),
        selectinload(Topic.children),
    )
    result = await session.execute(stmt)

    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Add retrievability
    topic_dict = TopicReadWithRelationships.model_validate(topic).model_dump()
    topic_dict["retrievability"] = calculate_retrievability(
        topic.stability, topic.last_reviewed_at, date.today()
    )
    return topic_dict


@router.get("/topics/{topic_id}/parents/", tags=["topics"])
async def read_topic_parents(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> list[TopicReadWithRelationships]:
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    stmt = stmt.options(
        selectinload(Topic.parents).selectinload(Topic.parents),
        selectinload(Topic.parents).selectinload(Topic.children),
    )
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic.parents


@router.get("/topics/{topic_id}/children/", tags=["topics"])
async def read_topic_children(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> list[TopicReadWithRelationships]:
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    stmt = stmt.options(
        selectinload(Topic.children).selectinload(Topic.parents),
        selectinload(Topic.children).selectinload(Topic.children),
    )
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic.children


@router.get("/topics/{topic_id}/related/", tags=["topics"])
async def read_topic_related(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> list[TopicRelatedRead]:
    """Get all topics related to this topic (bidirectional) with direction info"""
    # First verify the topic exists and belongs to user
    verify_stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    topic_result = await session.execute(verify_stmt)
    if not topic_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Topic not found")

    # Fetch outgoing (where this topic is 'from', related topic is 'to')
    outgoing_stmt = (
        select(Topic)
        .join(
            t_topic_other_relations, Topic.id == t_topic_other_relations.c.to_topic_id
        )
        .where(
            t_topic_other_relations.c.from_topic_id == topic_id,
            Topic.user_id == user_id,
        )
    )

    # Fetch incoming (where this topic is 'to', related topic is 'from')
    incoming_stmt = (
        select(Topic)
        .join(
            t_topic_other_relations, Topic.id == t_topic_other_relations.c.from_topic_id
        )
        .where(
            t_topic_other_relations.c.to_topic_id == topic_id, Topic.user_id == user_id
        )
    )

    outgoing_result = await session.execute(outgoing_stmt)
    incoming_result = await session.execute(incoming_stmt)

    outgoing_topics = outgoing_result.scalars().all()
    incoming_topics = incoming_result.scalars().all()

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


@router.post("/topics/", tags=["topics"])
async def insert_topic(
    topic: TopicCreate, session: SessionDep, user_id: UserIdDep
) -> TopicRead:
    new_topic = Topic(**topic.model_dump(), user_id=user_id)

    session.add(new_topic)
    await session.flush()
    await session.refresh(new_topic)

    return new_topic


@router.post("/topics/{parent_id}/children/", tags=["topics"])
async def insert_child(
    parent_id: int,
    payload: TopicChildRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicRelationshipResponse:
    # Resolve or create child topic
    if payload.child_id is not None:
        # Use existing topic
        child_id = payload.child_id
    else:
        # Create new topic from inline data
        # Assertion validated by Pydantic model_validator
        assert payload.child is not None
        new_child = Topic(**payload.child.model_dump(), user_id=user_id)
        session.add(new_child)
        await session.flush()
        child_id = new_child.id

    await _insert_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=parent_id,
    )

    # Fetch both topics with relationships
    stmt = (
        select(Topic)
        .where(Topic.id.in_([parent_id, child_id]), Topic.user_id == user_id)
        .options(
            selectinload(Topic.parents),
            selectinload(Topic.children),
        )
    )
    result = await session.execute(stmt)
    topics = result.scalars().all()
    topic_map = {t.id: t for t in topics}

    return TopicRelationshipResponse(
        parent=topic_map[parent_id],
        child=topic_map[child_id],
    )


@router.post("/topics/{child_id}/parents/", tags=["topics"])
async def insert_parent(
    child_id: int,
    payload: TopicParentRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicRelationshipResponse:
    # Resolve or create parent topic
    if payload.parent_id is not None:
        # Use existing topic
        parent_id = payload.parent_id
    else:
        # Create new topic from inline data
        # Assertion validated by Pydantic model_validator
        assert payload.parent is not None
        new_parent = Topic(**payload.parent.model_dump(), user_id=user_id)
        session.add(new_parent)
        await session.flush()
        parent_id = new_parent.id

    await _insert_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=child_id,
    )

    # Fetch both topics with relationships
    stmt = (
        select(Topic)
        .where(Topic.id.in_([parent_id, child_id]), Topic.user_id == user_id)
        .options(
            selectinload(Topic.parents),
            selectinload(Topic.children),
        )
    )
    result = await session.execute(stmt)
    topics = result.scalars().all()
    topic_map = {t.id: t for t in topics}

    return TopicRelationshipResponse(
        parent=topic_map[parent_id],
        child=topic_map[child_id],
    )


@router.delete("/topics/{parent_id}/children/{child_id}/", tags=["topics"])
async def delete_child(
    parent_id: int,
    child_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReadWithRelationships:
    return await _delete_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=parent_id,
    )


@router.delete("/topics/{child_id}/parents/{parent_id}/", tags=["topics"])
async def delete_parent(
    child_id: int,
    parent_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReadWithRelationships:
    return await _delete_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=child_id,
    )


@router.post("/topics/{from_topic_id}/related/", tags=["topics"])
async def create_topic_other_relationship(
    from_topic_id: int,
    relationship: TopicOtherRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicOtherRelationshipResponse:
    """Create a directional relationship from one topic to another"""
    # Verify from_topic exists and belongs to user
    from_topic = await session.get(Topic, from_topic_id)
    if not from_topic or from_topic.user_id != user_id:
        raise HTTPException(status_code=404, detail="From topic not found")

    # Resolve or create to_topic
    if relationship.to_topic_id is not None:
        # Use existing topic
        to_topic_id = relationship.to_topic_id
        to_topic = await session.get(Topic, to_topic_id)
        if not to_topic or to_topic.user_id != user_id:
            raise HTTPException(status_code=404, detail="To topic not found")
    else:
        # Create new topic from inline data
        # Assertion validated by Pydantic model_validator
        assert relationship.to_topic is not None
        new_to_topic = Topic(**relationship.to_topic.model_dump(), user_id=user_id)
        session.add(new_to_topic)
        await session.flush()
        to_topic_id = new_to_topic.id

    # Check for self-reference
    if from_topic_id == to_topic_id:
        raise HTTPException(status_code=400, detail="Cannot relate topic to itself")

    # Insert relationship
    stmt = insert(t_topic_other_relations).values(
        from_topic_id=from_topic_id,
        to_topic_id=to_topic_id,
        inserted_at=datetime.now(dt_timezone.utc),
        updated_at=datetime.now(dt_timezone.utc),
    )
    try:
        await session.execute(stmt)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Relationship already exists")

    # Re-fetch both topics to ensure all computed properties are loaded
    stmt = select(Topic).where(
        Topic.id.in_([from_topic_id, to_topic_id]), Topic.user_id == user_id
    )
    result = await session.execute(stmt)
    topics = result.scalars().all()
    topic_map = {t.id: t for t in topics}

    return TopicOtherRelationshipResponse(
        from_topic=topic_map[from_topic_id], to_topic=topic_map[to_topic_id]
    )


@router.delete("/topics/{from_topic_id}/related/{to_topic_id}/", tags=["topics"])
async def delete_topic_other_relationship(
    from_topic_id: int,
    to_topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    """Delete a bidirectional relationship between topics"""
    # Verify from_topic belongs to user
    from_topic = await session.get(Topic, from_topic_id)
    if not from_topic or from_topic.user_id != user_id:
        raise HTTPException(status_code=404, detail="Topic not found")

    stmt = delete(t_topic_other_relations).where(
        t_topic_other_relations.c.from_topic_id == from_topic_id,
        t_topic_other_relations.c.to_topic_id == to_topic_id,
    )
    result = await session.execute(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Relationship not found")


@router.get("/topics/{topic_id}/review-sessions/", tags=["topics"])
async def read_review_sessions_for_topic(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[ReviewSessionReadWithReviews]:
    stmt = select(ReviewSession).where(
        ReviewSession.reviews.any(Review.topic_id == topic_id), ReviewSession.user_id == user_id
    )
    stmt = stmt.options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/topics/{topic_id}/", tags=["topics"])
async def update_topic(
    topic_id: int, topic: TopicUpdate, session: SessionDep, user_id: UserIdDep
) -> TopicRead:
    update_values = topic.model_dump(exclude_unset=True)

    if update_values:
        stmt = (
            update(Topic)
            .where(Topic.id == topic_id, Topic.user_id == user_id)
            .values(update_values)
        )
        result = await session.execute(stmt)

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Topic not found")

    # Fetch and return updated topic
    select_stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    result = await session.execute(select_stmt)
    return result.scalar_one()


@router.delete("/topics/{topic_id}/", tags=["topics"])
async def delete_topic(topic_id: int, session: SessionDep, user_id: UserIdDep):
    stmt = (
        delete(Topic)
        .where(Topic.id == topic_id, Topic.user_id == user_id)
        .returning(Topic)
    )
    result = await session.execute(stmt)
    deleted_topic = result.scalar_one_or_none()

    if not deleted_topic:
        raise HTTPException(status_code=404, detail="Topic not found")