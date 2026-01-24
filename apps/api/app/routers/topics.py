from datetime import datetime, timezone as dt_timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import delete, desc, func, insert, or_, select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.constants import ChildHandlingStrategy
from app.dependencies import SessionDep, UserIdDep
from app.models import (
    Topic,
    t_topic_other_relations,
    ReviewSession,
    Review,
    FsrsState,
    Source,
)
from app.schemas import (
    TopicRead,
    TopicCreate,
    TopicUpdate,
    TopicSummaryRead,
    TopicDetailRead,
    TopicChildRelationshipCreate,
    TopicRelationshipResponse,
    TopicOtherRelationshipCreate,
    TopicOtherRelationshipResponse,
    ReviewSessionReadWithReviews,
    TopicRelatedRead,
    RelationshipDirection,
)

router = APIRouter()


async def is_descendant_of(
    session: AsyncSession, potential_descendant_id: int, ancestor_id: int
) -> bool:
    """
    Check if potential_descendant is a descendant of ancestor using ltree.
    Returns True if setting ancestor's parent to potential_descendant would create a cycle.

    Uses O(1) ltree operator: descendant.path <@ ancestor.path
    """
    result = await session.execute(
        text("""
            SELECT EXISTS (
                SELECT 1 FROM topics d, topics a
                WHERE d.id = :descendant_id
                  AND a.id = :ancestor_id
                  AND d.path <@ a.path
            )
        """),
        {"descendant_id": potential_descendant_id, "ancestor_id": ancestor_id},
    )
    return result.scalar()


async def get_topic_or_404(session: AsyncSession, topic_id: int, user_id: str) -> Topic:
    """Get a topic or raise 404 if not found."""
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


async def load_topic_with_relationships(
    session: AsyncSession, topic_id: int, user_id: str
) -> Topic:
    """Load a topic with parent, children, related, and sources relationships."""
    stmt = (
        select(Topic)
        .where(Topic.id == topic_id, Topic.user_id == user_id)
        .options(
            selectinload(Topic.parent).selectinload(Topic.fsrs_state),
            selectinload(Topic.children).selectinload(Topic.fsrs_state),
            selectinload(Topic.related_outgoing).selectinload(Topic.fsrs_state),
            selectinload(Topic.related_incoming).selectinload(Topic.fsrs_state),
            selectinload(Topic.sources).selectinload(Source.fsrs_state),
            selectinload(Topic.fsrs_state),
        )
    )
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()
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
) -> list[TopicSummaryRead]:
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
        already_related = outgoing.union(incoming)

        stmt = stmt.where(Topic.id.notin_(already_related))

    if addable_as_parent_to is not None:
        # For tree structure: exclude self and all descendants (to prevent cycles)
        # Using ltree: find all topics where target.path <@ candidate.path (target is descendant of candidate)
        descendants_subq = select(Topic.id).where(
            Topic.user_id == user_id,
            text("""
                EXISTS (
                    SELECT 1 FROM topics candidate, topics target
                    WHERE candidate.id = :parent_candidate_id
                      AND target.id = topics.id
                      AND target.path <@ candidate.path
                )
            """).bindparams(parent_candidate_id=addable_as_parent_to),
        )
        stmt = stmt.where(Topic.id.notin_(descendants_subq))

        # Also exclude current parent
        current_parent = select(Topic.parent_id).where(Topic.id == addable_as_parent_to)
        stmt = stmt.where(
            or_(
                Topic.id != current_parent.scalar_subquery(),
                current_parent.scalar_subquery().is_(None),
            )
        )

    if addable_as_child_to is not None:
        # For tree structure: exclude self and all ancestors (to prevent cycles)
        # Using ltree: find all topics where candidate.path <@ target.path (candidate is descendant of target)
        ancestors_subq = select(Topic.id).where(
            Topic.user_id == user_id,
            text("""
                EXISTS (
                    SELECT 1 FROM topics candidate, topics target
                    WHERE candidate.id = :child_candidate_id
                      AND target.id = topics.id
                      AND candidate.path <@ target.path
                )
            """).bindparams(child_candidate_id=addable_as_child_to),
        )
        stmt = stmt.where(Topic.id.notin_(ancestors_subq))

        # Also exclude current children
        children_subq = select(Topic.id).where(Topic.parent_id == addable_as_child_to)
        stmt = stmt.where(Topic.id.notin_(children_subq))

    if addable_to_review_session is not None:
        # Filter out topics already in the review session
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
    stmt = stmt.options(selectinload(Topic.fsrs_state))

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
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[TopicSummaryRead]:
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

    # srs_enabled filter using EXISTS subquery to avoid join conflicts with selectinload
    if srs_enabled is not None:
        if srs_enabled:
            stmt = stmt.where(
                select(FsrsState.id)
                .where(
                    FsrsState.id == Topic.fsrs_state_id,
                    FsrsState.srs_enabled.is_(True),
                )
                .exists()
            )
        else:
            stmt = stmt.where(
                or_(
                    Topic.fsrs_state_id.is_(None),
                    select(FsrsState.id)
                    .where(
                        FsrsState.id == Topic.fsrs_state_id,
                        FsrsState.srs_enabled.is_(False),
                    )
                    .exists(),
                )
            )

    if root is not None and root is True:
        # Root topics have no parent
        stmt = stmt.where(Topic.parent_id.is_(None))

    # has_stability filter using EXISTS subquery to avoid join conflicts with selectinload
    if has_stability is not None:
        if has_stability:
            stmt = stmt.where(
                select(FsrsState.id)
                .where(
                    FsrsState.id == Topic.fsrs_state_id,
                    FsrsState.stability.isnot(None),
                )
                .exists()
            )
        else:
            stmt = stmt.where(
                or_(
                    Topic.fsrs_state_id.is_(None),
                    select(FsrsState.id)
                    .where(
                        FsrsState.id == Topic.fsrs_state_id,
                        FsrsState.stability.is_(None),
                    )
                    .exists(),
                )
            )

    stmt = stmt.options(selectinload(Topic.fsrs_state))

    # Apply limit if provided
    if limit is not None:
        stmt = stmt.limit(limit)

    result = await session.execute(stmt)
    return result.scalars().unique().all()


@router.get("/topics/{topic_id}/", tags=["topics"])
async def read_topic(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> TopicDetailRead:
    return await load_topic_with_relationships(session, topic_id, user_id)


@router.get("/topics/{topic_id}/children/", tags=["topics"])
async def read_topic_children(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> list[TopicSummaryRead]:
    """Get all children of a topic."""
    # Verify topic exists and belongs to user
    await get_topic_or_404(session, topic_id, user_id)

    # Query children
    stmt = (
        select(Topic)
        .where(Topic.parent_id == topic_id, Topic.user_id == user_id)
        .options(selectinload(Topic.fsrs_state))
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/topics/{topic_id}/related/", tags=["topics"])
async def read_topic_related(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> list[TopicRelatedRead]:
    """Get all topics related to this topic (bidirectional) with direction info"""
    # First verify the topic exists and belongs to user
    await get_topic_or_404(session, topic_id, user_id)

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
        .options(selectinload(Topic.fsrs_state))
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
        .options(selectinload(Topic.fsrs_state))
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
    # Extract fields for Topic model (exclude srs_enabled and inherit_fsrs which are for FsrsState)
    topic_data = topic.model_dump(exclude={"srs_enabled", "inherit_fsrs"})
    new_topic = Topic(**topic_data, user_id=user_id)

    # Create FsrsState if srs_enabled
    if topic.srs_enabled:
        fsrs_state = FsrsState(srs_enabled=True)

        # Handle FSRS inheritance from parent
        if topic.inherit_fsrs and topic.parent_id:
            parent = await session.get(Topic, topic.parent_id)
            if parent and parent.fsrs_state:
                fsrs_state.inherited_stability = parent.fsrs_state.stability
                fsrs_state.inherited_difficulty = parent.fsrs_state.difficulty
                fsrs_state.inherited_state = parent.fsrs_state.state
                fsrs_state.inherited_step = parent.fsrs_state.step
                fsrs_state.inherited_last_review = parent.fsrs_state.last_reviewed_at

        session.add(fsrs_state)
        await session.flush()
        new_topic.fsrs_state_id = fsrs_state.id

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
    # Verify parent exists
    parent = await get_topic_or_404(session, parent_id, user_id)

    # Resolve or create child topic
    if payload.child_id is not None:
        child = await get_topic_or_404(session, payload.child_id, user_id)

        # Check for cycles: child cannot already be an ancestor of parent
        if await is_descendant_of(session, parent_id, payload.child_id):
            raise HTTPException(
                status_code=409,
                detail="Cannot add ancestor as child: would create cycle",
            )

        # Check if already a child
        if child.parent_id == parent_id:
            raise HTTPException(status_code=409, detail="Topic is already a child")

        # Set parent
        child.parent_id = parent_id
        child_id = payload.child_id
    else:
        # Create new topic from inline data
        assert payload.child is not None
        child_data = payload.child.model_dump(exclude={"srs_enabled", "inherit_fsrs"})
        child_data["parent_id"] = parent_id
        new_child = Topic(**child_data, user_id=user_id)

        # Handle FsrsState creation
        if payload.child.srs_enabled:
            fsrs_state = FsrsState(srs_enabled=True)
            if payload.child.inherit_fsrs and parent.fsrs_state:
                fsrs_state.inherited_stability = parent.fsrs_state.stability
                fsrs_state.inherited_difficulty = parent.fsrs_state.difficulty
                fsrs_state.inherited_state = parent.fsrs_state.state
                fsrs_state.inherited_step = parent.fsrs_state.step
                fsrs_state.inherited_last_review = parent.fsrs_state.last_reviewed_at
            session.add(fsrs_state)
            await session.flush()
            new_child.fsrs_state_id = fsrs_state.id

        session.add(new_child)
        await session.flush()
        child_id = new_child.id

    await session.commit()

    # Load both with relationships
    parent_topic = await load_topic_with_relationships(session, parent_id, user_id)
    child_topic = await load_topic_with_relationships(session, child_id, user_id)

    return TopicRelationshipResponse(parent=parent_topic, child=child_topic)


@router.delete("/topics/{parent_id}/children/{child_id}/", tags=["topics"])
async def delete_child(
    parent_id: int,
    child_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicDetailRead:
    """Remove a child from a parent (sets child's parent_id to null)."""
    await get_topic_or_404(session, parent_id, user_id)  # Verify parent exists
    child = await get_topic_or_404(session, child_id, user_id)

    if child.parent_id != parent_id:
        raise HTTPException(status_code=404, detail="Child relationship not found")

    # Remove parent reference (orphan the child)
    child.parent_id = None
    await session.commit()

    return await load_topic_with_relationships(session, parent_id, user_id)


@router.post("/topics/{from_topic_id}/related/", tags=["topics"])
async def create_topic_other_relationship(
    from_topic_id: int,
    relationship: TopicOtherRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicOtherRelationshipResponse:
    """Create a directional relationship from one topic to another"""
    # Verify from_topic exists and belongs to user
    await get_topic_or_404(session, from_topic_id, user_id)

    # Resolve or create to_topic
    if relationship.to_topic_id is not None:
        to_topic_id = relationship.to_topic_id
        await get_topic_or_404(session, to_topic_id, user_id)  # Verify to_topic exists
    else:
        # Create new topic from inline data
        assert relationship.to_topic is not None
        to_topic_data = relationship.to_topic.model_dump(
            exclude={"srs_enabled", "inherit_fsrs"}
        )
        new_to_topic = Topic(**to_topic_data, user_id=user_id)

        if relationship.to_topic.srs_enabled:
            fsrs_state = FsrsState(srs_enabled=True)
            session.add(fsrs_state)
            await session.flush()
            new_to_topic.fsrs_state_id = fsrs_state.id

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

    # Re-fetch both topics
    stmt = (
        select(Topic)
        .where(Topic.id.in_([from_topic_id, to_topic_id]), Topic.user_id == user_id)
        .options(selectinload(Topic.fsrs_state))
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
    """Delete a directional relationship between topics"""
    # Verify from_topic belongs to user
    await get_topic_or_404(session, from_topic_id, user_id)

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
        ReviewSession.reviews.any(Review.topic_id == topic_id),
        ReviewSession.user_id == user_id,
    )
    stmt = stmt.options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    result = await session.execute(stmt)
    return result.scalars().all()


@router.patch("/topics/{topic_id}/", tags=["topics"])
async def update_topic(
    topic_id: int, payload: TopicUpdate, session: SessionDep, user_id: UserIdDep
) -> TopicDetailRead:
    """Update a topic using PATCH semantics."""
    topic = await get_topic_or_404(session, topic_id, user_id)

    update_data = payload.model_dump(exclude_unset=True)

    # Handle parent_id change with cycle detection
    if "parent_id" in update_data:
        new_parent_id = update_data["parent_id"]
        if new_parent_id is not None:
            # Verify new parent exists
            await get_topic_or_404(session, new_parent_id, user_id)
            # Check for cycles: new parent cannot be a descendant of this topic
            if await is_descendant_of(session, new_parent_id, topic_id):
                raise HTTPException(409, "Cannot set parent: would create cycle")
        topic.parent_id = new_parent_id
        del update_data["parent_id"]

    # Handle srs_enabled toggle
    if "srs_enabled" in update_data:
        if update_data["srs_enabled"] and topic.fsrs_state_id is None:
            # Create fsrs_state
            fsrs_state = FsrsState(srs_enabled=True)
            session.add(fsrs_state)
            await session.flush()
            topic.fsrs_state_id = fsrs_state.id
        elif not update_data["srs_enabled"] and topic.fsrs_state:
            topic.fsrs_state.srs_enabled = False
        del update_data["srs_enabled"]

    # Apply remaining updates
    for key, value in update_data.items():
        setattr(topic, key, value)

    await session.commit()
    return await load_topic_with_relationships(session, topic_id, user_id)


@router.delete("/topics/{topic_id}/", tags=["topics"])
async def delete_topic(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
    handle_children_by: ChildHandlingStrategy | None = Query(default=None),
):
    """Delete a topic. If topic has children, must specify handle_children_by strategy."""
    topic = await get_topic_or_404(session, topic_id, user_id)

    # Check if topic has children
    children_count = await session.scalar(
        select(func.count()).select_from(Topic).where(Topic.parent_id == topic_id)
    )

    if children_count > 0:
        if handle_children_by is None:
            raise HTTPException(
                status_code=409,
                detail=f"Topic has {children_count} children. Specify handle_children_by: delete, orphan, or reparent",
            )

        if handle_children_by == ChildHandlingStrategy.DELETE:
            # Recursively delete all descendants using ltree
            await session.execute(
                delete(Topic).where(
                    text(
                        "topics.path <@ (SELECT path FROM topics WHERE id = :delete_topic_id)"
                    ).bindparams(delete_topic_id=topic_id)
                )
            )
        elif handle_children_by == ChildHandlingStrategy.ORPHAN:
            # Set children's parent_id to null (make them root topics)
            await session.execute(
                update(Topic).where(Topic.parent_id == topic_id).values(parent_id=None)
            )
        elif handle_children_by == ChildHandlingStrategy.REPARENT:
            if topic.parent_id is None:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot reparent: topic has no parent (is a root topic)",
                )
            # Set children's parent_id to grandparent
            await session.execute(
                update(Topic)
                .where(Topic.parent_id == topic_id)
                .values(parent_id=topic.parent_id)
            )

        # Now delete the topic itself (if not already deleted by recursive delete)
        if handle_children_by != ChildHandlingStrategy.DELETE:
            await session.execute(
                delete(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
            )
    else:
        # No children, just delete
        await session.execute(
            delete(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
        )

    await session.commit()
