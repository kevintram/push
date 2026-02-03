"""Topic business logic and data access."""

from typing import Literal

from sqlalchemy import cast, delete, desc, func, or_, select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.types import TIMESTAMP

from app.constants import ChildHandlingStrategy
from app.exceptions import (
    AlreadyExistsError,
    BadRequestError,
    ConflictError,
    ConversionBlockedError,
    CycleDetectedError,
    HasChildrenError,
    NotFoundError,
    SelfReferenceError,
)
from app.models import (
    EntityRelation,
    FsrsState,
    Practice,
    Review,
    ReviewSession,
    Source,
    Topic,
    t_practice_sources,
    t_practice_topics,
    t_source_topics,
)
from app.utils.fsrs import apply_inherited_fsrs


async def get_topic(session: AsyncSession, topic_id: int, user_id: str) -> Topic:
    """Get a topic or raise NotFoundError."""
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic", topic_id)
    return topic


async def is_descendant_of(
    session: AsyncSession, potential_descendant_id: int, ancestor_id: int
) -> bool:
    """Check if potential_descendant is a descendant of ancestor using ltree.

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


async def load_topic_with_relationships(
    session: AsyncSession, topic_id: int, user_id: str
) -> Topic:
    """Load a topic with parent, children, sources, and practices relationships.

    Note: related_outgoing and related_incoming are now fetched separately
    via get_topic_related() since they use the entity_relations table.
    """
    stmt = (
        select(Topic)
        .where(Topic.id == topic_id, Topic.user_id == user_id)
        .options(
            selectinload(Topic.parent).selectinload(Topic.fsrs_state),
            selectinload(Topic.children).selectinload(Topic.fsrs_state),
            selectinload(Topic.sources).selectinload(Source.fsrs_state),
            selectinload(Topic.practices).selectinload(Practice.fsrs_state),
            selectinload(Topic.fsrs_state),
        )
    )
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic", topic_id)
    return topic


async def search_topics(
    session: AsyncSession,
    user_id: str,
    *,
    addable_as_parent_to: int | None = None,
    addable_as_child_to: int | None = None,
    addable_as_related_to: int | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[Topic]:
    """Search topics with various filters."""
    cleaned_query = query.strip() if query else ""
    stmt = select(Topic).where(Topic.user_id == user_id)

    if addable_as_related_to is not None:
        # 1. Exclude the topic itself
        stmt = stmt.where(Topic.id != addable_as_related_to)

        # 2. Exclude already related topics (bidirectional) using entity_relations
        outgoing = select(EntityRelation.to_topic_id).where(
            EntityRelation.from_topic_id == addable_as_related_to,
            EntityRelation.to_topic_id.isnot(None),
        )
        incoming = select(EntityRelation.from_topic_id).where(
            EntityRelation.to_topic_id == addable_as_related_to,
            EntityRelation.from_topic_id.isnot(None),
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
    return list(result.scalars().all())


async def list_topics(
    session: AsyncSession,
    user_id: str,
    *,
    query: str | None = None,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
    has_stability: bool | None = None,
    srs_enabled: bool | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
    order_by: Literal["updated_at", "recent_activity"] = "updated_at",
) -> list[Topic]:
    """List topics with optional filters."""
    stmt = select(Topic).where(Topic.user_id == user_id)

    # Text search filter
    if query:
        like_pattern = f"%{query.strip()}%"
        stmt = stmt.where(
            or_(
                Topic.name.ilike(like_pattern),
                Topic.notes.ilike(like_pattern),
            )
        )

    # Apply ordering
    recent_activity = None
    if order_by == "recent_activity":
        last_reviewed_at = (
            select(FsrsState.last_reviewed_at)
            .where(FsrsState.id == Topic.fsrs_state_id)
            .scalar_subquery()
        )
        last_reviewed_ts = cast(last_reviewed_at, TIMESTAMP(timezone=True))
        recent_activity = func.greatest(
            Topic.updated_at,
            func.coalesce(last_reviewed_ts, Topic.updated_at),
        )
        if order == "desc":
            stmt = stmt.order_by(desc(recent_activity))
        else:
            stmt = stmt.order_by(recent_activity)
    else:
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

    if recent_activity is not None:
        stmt = stmt.add_columns(recent_activity.label("recent_activity_at"))

    result = await session.execute(stmt)
    if recent_activity is not None:
        topics: list[Topic] = []
        for topic, activity_at in result.all():
            topic.recent_activity_at = activity_at
            topics.append(topic)
        return topics

    return list(result.scalars().unique().all())


async def create_topic(
    session: AsyncSession,
    user_id: str,
    *,
    name: str,
    notes: str | None = None,
    parent_id: int | None = None,
    srs_enabled: bool = False,
    inherit_fsrs: bool = False,
    inherit_fsrs_from: FsrsState | None = None,
    inboxed: bool = False,
    archived: bool = False,
) -> Topic:
    """Create a new topic."""
    new_topic = Topic(
        user_id=user_id,
        name=name,
        notes=notes or "",
        parent_id=parent_id,
        inboxed=inboxed,
        archived=archived,
    )

    # Create FsrsState if srs_enabled or inherit_fsrs
    if srs_enabled or inherit_fsrs:
        fsrs_state = FsrsState(srs_enabled=srs_enabled)

        if inherit_fsrs:
            source_fsrs = inherit_fsrs_from
            if source_fsrs is None and parent_id:
                parent = await session.get(Topic, parent_id)
                if parent and parent.fsrs_state:
                    source_fsrs = parent.fsrs_state
            if source_fsrs is not None:
                apply_inherited_fsrs(fsrs_state, source_fsrs)

        session.add(fsrs_state)
        await session.flush()
        new_topic.fsrs_state_id = fsrs_state.id

    session.add(new_topic)
    await session.flush()
    await session.refresh(new_topic)

    return new_topic


async def get_topic_children(
    session: AsyncSession, topic_id: int, user_id: str
) -> list[Topic]:
    """Get all children of a topic."""
    # Verify topic exists and belongs to user
    await get_topic(session, topic_id, user_id)

    # Query children
    stmt = (
        select(Topic)
        .where(Topic.parent_id == topic_id, Topic.user_id == user_id)
        .options(selectinload(Topic.fsrs_state))
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def add_child(
    session: AsyncSession,
    user_id: str,
    parent_id: int,
    *,
    child_id: int | None = None,
    child_name: str | None = None,
    child_notes: str | None = None,
    child_srs_enabled: bool = False,
    child_inherit_fsrs: bool = False,
    child_inboxed: bool = False,
    child_archived: bool = False,
) -> tuple[Topic, Topic]:
    """Add or create a child topic. Returns (parent, child)."""
    # Verify parent exists
    parent = await get_topic(session, parent_id, user_id)

    if child_id is not None:
        child = await get_topic(session, child_id, user_id)

        # Check for cycles: child cannot already be an ancestor of parent
        if await is_descendant_of(session, parent_id, child_id):
            raise CycleDetectedError("topics")

        # Check if already a child
        if child.parent_id == parent_id:
            raise AlreadyExistsError("Topic is already a child")

        # Set parent
        child.parent_id = parent_id
        result_child_id = child_id
    else:
        # Create new topic from inline data
        new_child = Topic(
            user_id=user_id,
            name=child_name,
            notes=child_notes or "",
            parent_id=parent_id,
            inboxed=child_inboxed,
            archived=child_archived,
        )

        # Handle FsrsState creation
        if child_srs_enabled or child_inherit_fsrs:
            fsrs_state = FsrsState(srs_enabled=child_srs_enabled)
            if child_inherit_fsrs and parent.fsrs_state:
                apply_inherited_fsrs(fsrs_state, parent.fsrs_state)
            session.add(fsrs_state)
            await session.flush()
            new_child.fsrs_state_id = fsrs_state.id

        session.add(new_child)
        await session.flush()
        result_child_id = new_child.id

    await session.commit()

    # Load both with relationships
    parent_topic = await load_topic_with_relationships(session, parent_id, user_id)
    child_topic = await load_topic_with_relationships(session, result_child_id, user_id)

    return parent_topic, child_topic


async def set_topic_parent(
    session: AsyncSession,
    user_id: str,
    topic_id: int,
    *,
    parent_id: int | None = None,
    parent_data: dict | None = None,
) -> tuple[Topic, Topic]:
    """Set or replace the parent of a topic. Returns (parent, child)."""
    if parent_id is None and parent_data is None:
        raise BadRequestError("Must provide either parent_id or parent data")

    resolved_parent_id = parent_id
    if parent_data is not None:
        new_parent = await create_topic(session, user_id, **parent_data)
        resolved_parent_id = new_parent.id

    if resolved_parent_id == topic_id:
        raise SelfReferenceError("topic")

    await update_topic(
        session,
        topic_id,
        user_id,
        parent_id=resolved_parent_id,
    )

    parent_topic = await load_topic_with_relationships(
        session, resolved_parent_id, user_id
    )
    child_topic = await load_topic_with_relationships(session, topic_id, user_id)
    return parent_topic, child_topic


async def remove_child(
    session: AsyncSession, parent_id: int, child_id: int, user_id: str
) -> Topic:
    """Remove a child from a parent (sets child's parent_id to null). Returns parent."""
    await get_topic(session, parent_id, user_id)  # Verify parent exists
    child = await get_topic(session, child_id, user_id)

    if child.parent_id != parent_id:
        raise NotFoundError("Child relationship")

    # Remove parent reference (orphan the child)
    child.parent_id = None
    await session.commit()

    return await load_topic_with_relationships(session, parent_id, user_id)


async def get_topic_related(
    session: AsyncSession, topic_id: int, user_id: str
) -> tuple[list[Topic], list[Topic]]:
    """Get all topics related to this topic. Returns (outgoing, incoming).

    Note: This returns only topic↔topic relations for backward compatibility.
    For full entity relations including sources, use get_topic_entity_relations.
    """
    # First verify the topic exists and belongs to user
    await get_topic(session, topic_id, user_id)

    # Fetch outgoing (where this topic is 'from', related topic is 'to')
    outgoing_stmt = (
        select(Topic)
        .join(EntityRelation, Topic.id == EntityRelation.to_topic_id)
        .where(
            EntityRelation.from_topic_id == topic_id,
            EntityRelation.to_topic_id.isnot(None),
            Topic.user_id == user_id,
        )
        .options(selectinload(Topic.fsrs_state))
    )

    # Fetch incoming (where this topic is 'to', related topic is 'from')
    incoming_stmt = (
        select(Topic)
        .join(EntityRelation, Topic.id == EntityRelation.from_topic_id)
        .where(
            EntityRelation.to_topic_id == topic_id,
            EntityRelation.from_topic_id.isnot(None),
            Topic.user_id == user_id,
        )
        .options(selectinload(Topic.fsrs_state))
    )

    outgoing_result = await session.execute(outgoing_stmt)
    incoming_result = await session.execute(incoming_stmt)

    outgoing_topics = list(outgoing_result.scalars().all())
    incoming_topics = list(incoming_result.scalars().all())

    return outgoing_topics, incoming_topics


async def get_topic_related_entities(
    session: AsyncSession, topic_id: int, user_id: str
) -> tuple[list[dict], list[dict]]:
    """Get outgoing and incoming entity relations for a topic (including sources).

    Returns:
        Tuple of (outgoing_relations, incoming_relations) where each item is a dict
        containing full entity data with an entity_type discriminator.
    """
    from app.schemas.sources import SourceSummaryRead
    from app.schemas.topics import TopicSummaryRead

    # First verify the topic exists and belongs to user
    await get_topic(session, topic_id, user_id)

    # Fetch outgoing relations (from this topic to other entities)
    outgoing_stmt = (
        select(EntityRelation)
        .where(EntityRelation.from_topic_id == topic_id)
        .options(
            selectinload(EntityRelation.to_topic).selectinload(Topic.fsrs_state),
            selectinload(EntityRelation.to_source).selectinload(Source.fsrs_state),
        )
    )
    outgoing_result = await session.execute(outgoing_stmt)
    outgoing_relations = outgoing_result.scalars().all()

    outgoing = []
    for rel in outgoing_relations:
        if rel.to_topic_id:
            if rel.to_topic and rel.to_topic.user_id == user_id:
                topic_data = TopicSummaryRead.model_validate(rel.to_topic).model_dump()
                topic_data["entity_type"] = "topic"
                outgoing.append(topic_data)
        elif rel.to_source_id:
            if rel.to_source and rel.to_source.user_id == user_id:
                source_data = SourceSummaryRead.model_validate(
                    rel.to_source
                ).model_dump()
                source_data["entity_type"] = "source"
                outgoing.append(source_data)

    # Fetch incoming relations (from other entities to this topic)
    incoming_stmt = (
        select(EntityRelation)
        .where(EntityRelation.to_topic_id == topic_id)
        .options(
            selectinload(EntityRelation.from_topic).selectinload(Topic.fsrs_state),
            selectinload(EntityRelation.from_source).selectinload(Source.fsrs_state),
        )
    )
    incoming_result = await session.execute(incoming_stmt)
    incoming_relations = incoming_result.scalars().all()

    incoming = []
    for rel in incoming_relations:
        if rel.from_topic_id:
            if rel.from_topic and rel.from_topic.user_id == user_id:
                topic_data = TopicSummaryRead.model_validate(
                    rel.from_topic
                ).model_dump()
                topic_data["entity_type"] = "topic"
                incoming.append(topic_data)
        elif rel.from_source_id:
            if rel.from_source and rel.from_source.user_id == user_id:
                source_data = SourceSummaryRead.model_validate(
                    rel.from_source
                ).model_dump()
                source_data["entity_type"] = "source"
                incoming.append(source_data)

    return outgoing, incoming


async def create_topic_relationship(
    session: AsyncSession,
    user_id: str,
    from_topic_id: int,
    *,
    to_topic_id: int | None = None,
    to_topic_data: dict | None = None,
) -> tuple[Topic, Topic]:
    """Create a directional relationship from one topic to another. Returns (from_topic, to_topic)."""
    # Verify from_topic exists and belongs to user
    await get_topic(session, from_topic_id, user_id)

    # Resolve or create to_topic
    if to_topic_id is not None:
        resolved_to_topic_id = to_topic_id
        await get_topic(session, to_topic_id, user_id)  # Verify to_topic exists
    else:
        new_to_topic = await create_topic(session, user_id, **to_topic_data)
        resolved_to_topic_id = new_to_topic.id

    # Check for self-reference
    if from_topic_id == resolved_to_topic_id:
        raise SelfReferenceError("topic")

    # Insert relationship using entity_relations table
    relation = EntityRelation(
        from_topic_id=from_topic_id,
        to_topic_id=resolved_to_topic_id,
    )
    session.add(relation)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AlreadyExistsError("Relationship already exists")

    # Re-fetch both topics
    stmt = (
        select(Topic)
        .where(
            Topic.id.in_([from_topic_id, resolved_to_topic_id]),
            Topic.user_id == user_id,
        )
        .options(selectinload(Topic.fsrs_state))
    )
    result = await session.execute(stmt)
    topics = result.scalars().all()
    topic_map = {t.id: t for t in topics}

    return topic_map[from_topic_id], topic_map[resolved_to_topic_id]


async def delete_topic_relationship(
    session: AsyncSession, from_topic_id: int, to_topic_id: int, user_id: str
) -> None:
    """Delete a directional relationship between topics."""
    # Verify from_topic belongs to user
    await get_topic(session, from_topic_id, user_id)

    stmt = delete(EntityRelation).where(
        EntityRelation.from_topic_id == from_topic_id,
        EntityRelation.to_topic_id == to_topic_id,
    )
    result = await session.execute(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise NotFoundError("Relationship")


async def add_related_entity_to_topic(
    session: AsyncSession,
    topic_id: int,
    user_id: str,
    *,
    to_entity_type: str,
    to_entity_id: int | None,
    to_topic_data: dict | None = None,
    to_source_data: dict | None = None,
) -> None:
    """Add a related entity (topic or source) to this topic."""
    # Verify topic exists and belongs to user
    topic = await get_topic(session, topic_id, user_id)

    if to_entity_type == "topic":
        if to_entity_id is None:
            inherit_fsrs = bool(
                to_topic_data and to_topic_data.pop("inherit_fsrs", False)
            )
            new_topic = await create_topic(
                session,
                user_id,
                inherit_fsrs=inherit_fsrs,
                inherit_fsrs_from=topic.fsrs_state if inherit_fsrs else None,
                **(to_topic_data or {}),
            )
            to_entity_id = new_topic.id
        else:
            # Verify target topic exists and belongs to user
            await get_topic(session, to_entity_id, user_id)

        # Check for self-reference
        if topic_id == to_entity_id:
            raise SelfReferenceError("topic")

        relation = EntityRelation(
            from_topic_id=topic_id,
            to_topic_id=to_entity_id,
        )
    elif to_entity_type == "source":
        if to_entity_id is None:
            from app.sources.service import create_source

            inherit_fsrs = bool(
                to_source_data and to_source_data.pop("inherit_fsrs", False)
            )
            new_source = await create_source(
                session,
                user_id,
                inherit_fsrs=inherit_fsrs,
                inherit_fsrs_from=topic.fsrs_state if inherit_fsrs else None,
                **(to_source_data or {}),
            )
            to_entity_id = new_source.id
        else:
            # Verify source exists and belongs to user
            source_result = await session.execute(
                select(Source).where(
                    Source.id == to_entity_id, Source.user_id == user_id
                )
            )
            if not source_result.scalar_one_or_none():
                raise NotFoundError("Source", to_entity_id)

        relation = EntityRelation(
            from_topic_id=topic_id,
            to_source_id=to_entity_id,
        )
    else:
        raise BadRequestError(f"Invalid entity_type: {to_entity_type}")

    session.add(relation)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AlreadyExistsError("Relationship already exists")


async def remove_related_entity_from_topic(
    session: AsyncSession,
    topic_id: int,
    user_id: str,
    *,
    entity_type: str,
    entity_id: int,
) -> None:
    """Remove a related entity (topic or source) from this topic."""
    # Verify topic exists and belongs to user
    await get_topic(session, topic_id, user_id)

    if entity_type == "topic":
        stmt = delete(EntityRelation).where(
            EntityRelation.from_topic_id == topic_id,
            EntityRelation.to_topic_id == entity_id,
        )
    elif entity_type == "source":
        stmt = delete(EntityRelation).where(
            EntityRelation.from_topic_id == topic_id,
            EntityRelation.to_source_id == entity_id,
        )
    else:
        raise BadRequestError(f"Invalid entity_type: {entity_type}")

    result = await session.execute(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise NotFoundError("Relationship")


async def get_review_sessions_for_topic(
    session: AsyncSession, topic_id: int, user_id: str
) -> list[ReviewSession]:
    """Get all review sessions that include this topic."""
    stmt = select(ReviewSession).where(
        ReviewSession.reviews.any(Review.topic_id == topic_id),
        ReviewSession.user_id == user_id,
    )
    stmt = stmt.options(selectinload(ReviewSession.reviews).selectinload(Review.topic))
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_topic(
    session: AsyncSession,
    topic_id: int,
    user_id: str,
    *,
    name: str | None = None,
    notes: str | None = None,
    parent_id: int | None = ...,  # Use ... as sentinel to distinguish from None
    srs_enabled: bool | None = None,
    inboxed: bool | None = None,
    archived: bool | None = None,
) -> Topic:
    """Update a topic using PATCH semantics."""
    topic = await get_topic(session, topic_id, user_id)

    # Handle parent_id change with cycle detection
    if parent_id is not ...:
        if parent_id is not None:
            # Verify new parent exists
            await get_topic(session, parent_id, user_id)
            # Check for cycles: new parent cannot be a descendant of this topic
            if await is_descendant_of(session, parent_id, topic_id):
                raise CycleDetectedError("topics")
        topic.parent_id = parent_id

    # Handle srs_enabled toggle
    if srs_enabled is not None:
        if srs_enabled and topic.fsrs_state_id is None:
            # Create fsrs_state
            fsrs_state = FsrsState(srs_enabled=True)
            session.add(fsrs_state)
            await session.flush()
            topic.fsrs_state_id = fsrs_state.id
        elif not srs_enabled and topic.fsrs_state:
            topic.fsrs_state.srs_enabled = False

    # Apply remaining updates
    if name is not None:
        topic.name = name
    if notes is not None:
        topic.notes = notes
    if inboxed is not None:
        topic.inboxed = inboxed
    if archived is not None:
        topic.archived = archived

    await session.commit()
    return await load_topic_with_relationships(session, topic_id, user_id)


async def delete_topic(
    session: AsyncSession,
    topic_id: int,
    user_id: str,
    *,
    handle_children_by: ChildHandlingStrategy | None = None,
) -> None:
    """Delete a topic. If topic has children, must specify handle_children_by strategy."""
    topic = await get_topic(session, topic_id, user_id)

    # Check if topic has children
    children_count = await session.scalar(
        select(func.count()).select_from(Topic).where(Topic.parent_id == topic_id)
    )

    if children_count > 0:
        if handle_children_by is None:
            raise HasChildrenError("Topic", children_count)

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
                raise BadRequestError(
                    "Cannot reparent: topic has no parent (is a root topic)"
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


# ===== Topic Practices =====


async def get_topic_practices(
    session: AsyncSession, topic_id: int, user_id: str
) -> list[Practice]:
    """Get all practices linked to a topic."""
    await get_topic(session, topic_id, user_id)
    stmt = (
        select(Practice)
        .join(t_practice_topics, Practice.id == t_practice_topics.c.practice_id)
        .where(t_practice_topics.c.topic_id == topic_id)
        .options(selectinload(Practice.fsrs_state))
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def add_practice_to_topic(
    session: AsyncSession,
    topic_id: int,
    user_id: str,
    *,
    practice_id: int | None = None,
    practice_data: dict | None = None,
) -> None:
    """Link a practice to a topic."""
    # Verify topic exists and belongs to user
    topic = await get_topic(session, topic_id, user_id)

    if practice_id is None:
        from app.practices.service import create_practice

        inherit_fsrs = bool(practice_data and practice_data.pop("inherit_fsrs", False))
        practice = await create_practice(
            session,
            user_id,
            inherit_fsrs=inherit_fsrs,
            inherit_fsrs_from=topic.fsrs_state if inherit_fsrs else None,
            **(practice_data or {}),
        )
        practice_id = practice.id
    else:
        # Verify practice exists and belongs to user
        stmt = select(Practice).where(
            Practice.id == practice_id, Practice.user_id == user_id
        )
        result = await session.execute(stmt)
        practice = result.scalar_one_or_none()
        if practice is None:
            raise NotFoundError("Practice", practice_id)

    # Check if already linked
    stmt = select(t_practice_topics).where(
        t_practice_topics.c.topic_id == topic_id,
        t_practice_topics.c.practice_id == practice_id,
    )
    result = await session.execute(stmt)
    if result.first() is not None:
        raise ConflictError("Practice is already linked to this topic")

    await session.execute(
        t_practice_topics.insert().values(topic_id=topic_id, practice_id=practice_id)
    )
    await session.commit()


async def remove_practice_from_topic(
    session: AsyncSession, topic_id: int, practice_id: int, user_id: str
) -> None:
    """Remove a practice link from a topic."""
    await get_topic(session, topic_id, user_id)

    result = await session.execute(
        delete(t_practice_topics).where(
            t_practice_topics.c.topic_id == topic_id,
            t_practice_topics.c.practice_id == practice_id,
        )
    )
    if result.rowcount == 0:
        raise NotFoundError("Topic-Practice link", practice_id)
    await session.commit()


# ===== Topic Conversions =====


async def check_topic_convertible_to_source(
    session: AsyncSession, topic_id: int, user_id: str
) -> tuple[bool, str | None]:
    """Check if a topic (and its subtree) can be converted to a source.

    Returns (can_convert, error_reason).
    Fails if any topic in subtree has sources covering it (via source_topics).
    """
    # Check if any topic in the subtree has covering sources
    result = await session.execute(
        text("""
            SELECT COUNT(*) FROM source_topics st
            JOIN topics t ON t.id = st.topic_id
            WHERE t.user_id = :user_id
              AND t.path <@ (SELECT path FROM topics WHERE id = :root_id AND user_id = :user_id)
        """),
        {"root_id": topic_id, "user_id": user_id},
    )
    covering_count = result.scalar()

    if covering_count > 0:
        return False, "topic or its children have sources covering them"

    return True, None


async def check_topic_convertible_to_practice(
    session: AsyncSession, topic_id: int, user_id: str
) -> tuple[bool, str | None]:
    """Check if a topic can be converted to a practice.

    Returns (can_convert, error_reason).
    Fails if topic has:
    - Children
    - Linked practices (practice_topics)
    - Sources covering it (source_topics)
    """
    # Check for children
    children_count = await session.execute(
        select(func.count())
        .select_from(Topic)
        .where(Topic.parent_id == topic_id, Topic.user_id == user_id)
    )
    if children_count.scalar() > 0:
        return False, "topic has children"

    # Check for linked practices
    practices_result = await session.execute(
        select(func.count())
        .select_from(t_practice_topics)
        .where(t_practice_topics.c.topic_id == topic_id)
    )
    practice_count = practices_result.scalar()
    if practice_count > 0:
        return False, "topic has linked practices"

    # Check for covering sources
    sources_result = await session.execute(
        select(func.count())
        .select_from(t_source_topics)
        .where(t_source_topics.c.topic_id == topic_id)
    )
    source_count = sources_result.scalar()
    if source_count > 0:
        return False, "topic has sources covering it"

    return True, None


async def convert_topic_to_source(
    session: AsyncSession, topic_id: int, user_id: str
) -> int:
    """Convert a topic (and its subtree) to a source hierarchy.

    Returns the new root source ID.

    Transformation:
    - Topic name -> Source title
    - Topic notes -> Source notes
    - Topic FSRS state -> New Source FSRS state
    - Topic flags -> Source flags
    - Child topics -> Child sources (recursive)
    - Entity relations -> Entity relations (from_source_id/to_source_id)
    - Linked practices -> practice_sources entries

    Raises ConversionBlockedError if any subtree topic has covering sources.
    """
    # 1. Verify topic exists
    await get_topic(session, topic_id, user_id)

    # 2. Check convertibility (recursive check for covering sources)
    can_convert, reason = await check_topic_convertible_to_source(
        session, topic_id, user_id
    )
    if not can_convert:
        raise ConversionBlockedError(reason)

    # 3. Get all topics in subtree (using ltree path)
    subtree_stmt = (
        select(Topic)
        .where(
            Topic.user_id == user_id,
            text(
                "topics.path <@ (SELECT path FROM topics WHERE id = :root_id)"
            ).bindparams(root_id=topic_id),
        )
        .options(
            selectinload(Topic.fsrs_state),
            selectinload(Topic.practices),
        )
    )
    result = await session.execute(subtree_stmt)
    all_topics = list(result.scalars().all())

    # 4. Build topic_id -> new_source mapping
    topic_to_source: dict[int, Source] = {}

    # Sort by path length to process parents before children
    all_topics.sort(key=lambda t: len(t.path or ""))

    for topic in all_topics:
        # Create new FSRS state if topic had one
        new_fsrs_state_id = None
        if topic.fsrs_state:
            new_fsrs = FsrsState(
                srs_enabled=topic.fsrs_state.srs_enabled,
                stability=topic.fsrs_state.stability,
                difficulty=topic.fsrs_state.difficulty,
                state=topic.fsrs_state.state,
                step=topic.fsrs_state.step,
                last_reviewed_at=topic.fsrs_state.last_reviewed_at,
                inherited_stability=topic.fsrs_state.inherited_stability,
                inherited_difficulty=topic.fsrs_state.inherited_difficulty,
                inherited_state=topic.fsrs_state.inherited_state,
                inherited_step=topic.fsrs_state.inherited_step,
                inherited_last_review=topic.fsrs_state.inherited_last_review,
            )
            session.add(new_fsrs)
            await session.flush()
            new_fsrs_state_id = new_fsrs.id

        # Determine parent source ID
        parent_source_id = None
        if topic.parent_id and topic.parent_id in topic_to_source:
            parent_source_id = topic_to_source[topic.parent_id].id

        # Create source
        new_source = Source(
            user_id=user_id,
            title=topic.name,
            notes=topic.notes,
            parent_id=parent_source_id,
            fsrs_state_id=new_fsrs_state_id,
            archived=topic.archived,
            inboxed=topic.inboxed,
        )
        session.add(new_source)
        await session.flush()

        topic_to_source[topic.id] = new_source

        # Migrate practices to new source
        for practice in topic.practices:
            await session.execute(
                t_practice_sources.insert().values(
                    practice_id=practice.id,
                    source_id=new_source.id,
                )
            )

        # Migrate reviews from topic to new source
        await session.execute(
            update(Review)
            .where(Review.topic_id == topic.id)
            .values(source_id=new_source.id, topic_id=None)
        )

    # 5. Migrate entity relations
    for topic in all_topics:
        new_source = topic_to_source[topic.id]

        # Get outgoing relations (from this topic)
        outgoing = await session.execute(
            select(EntityRelation).where(EntityRelation.from_topic_id == topic.id)
        )
        for rel in outgoing.scalars():
            # Create new relation from source
            # Handle to_topic_id -> to_source_id if that topic was also converted
            new_to_source_id = None
            new_to_topic_id = rel.to_topic_id

            if rel.to_topic_id and rel.to_topic_id in topic_to_source:
                # Target topic was also converted, point to new source
                new_to_source_id = topic_to_source[rel.to_topic_id].id
                new_to_topic_id = None

            new_rel = EntityRelation(
                from_source_id=new_source.id,
                to_topic_id=new_to_topic_id,
                to_source_id=new_to_source_id if new_to_source_id else rel.to_source_id,
            )
            session.add(new_rel)

        # Get incoming relations (to this topic)
        incoming = await session.execute(
            select(EntityRelation).where(EntityRelation.to_topic_id == topic.id)
        )
        for rel in incoming.scalars():
            # Skip if from_topic is in our subtree (will be handled by outgoing)
            if rel.from_topic_id and rel.from_topic_id in topic_to_source:
                continue

            # Create new relation pointing to source
            new_rel = EntityRelation(
                from_topic_id=rel.from_topic_id,
                from_source_id=rel.from_source_id,
                to_source_id=new_source.id,
            )
            session.add(new_rel)

    # 6. Delete original topics (cascade will clean up old relations)
    # Delete in reverse order (children first) to respect FK constraints
    all_topics.sort(key=lambda t: len(t.path or ""), reverse=True)
    for topic in all_topics:
        await session.delete(topic)

    await session.commit()

    return topic_to_source[topic_id].id


async def convert_topic_to_practice(
    session: AsyncSession, topic_id: int, user_id: str
) -> int:
    """Convert a topic to a practice.

    Returns the new practice ID.

    Transformation:
    - Topic name -> Practice prompt
    - Topic notes -> Practice answer
    - Topic FSRS state -> New Practice FSRS state
    - Topic flags -> Practice flags
    - Parent topics -> practice_topics entries
    - Related topics -> practice_topics entries

    Raises ConversionBlockedError if topic has practices or covering sources.
    """
    # 1. Verify topic exists and load relationships
    topic = await load_topic_with_relationships(session, topic_id, user_id)

    # 2. Check convertibility
    can_convert, reason = await check_topic_convertible_to_practice(
        session, topic_id, user_id
    )
    if not can_convert:
        raise ConversionBlockedError(reason)

    # 3. Create new FSRS state if needed
    new_fsrs_state_id = None
    if topic.fsrs_state:
        new_fsrs = FsrsState(
            srs_enabled=topic.fsrs_state.srs_enabled,
            stability=topic.fsrs_state.stability,
            difficulty=topic.fsrs_state.difficulty,
            state=topic.fsrs_state.state,
            step=topic.fsrs_state.step,
            last_reviewed_at=topic.fsrs_state.last_reviewed_at,
        )
        session.add(new_fsrs)
        await session.flush()
        new_fsrs_state_id = new_fsrs.id

    # 4. Create practice
    new_practice = Practice(
        user_id=user_id,
        prompt=topic.name,
        answer=topic.notes,
        fsrs_state_id=new_fsrs_state_id,
        archived=topic.archived,
        inboxed=topic.inboxed,
    )
    session.add(new_practice)
    await session.flush()

    # Migrate reviews from topic to new practice
    await session.execute(
        update(Review)
        .where(Review.topic_id == topic_id)
        .values(practice_id=new_practice.id, topic_id=None)
    )

    # 5. Collect associated topics (parents + related topics)
    associated_topic_ids: set[int] = set()

    # Add parent topics (walk up the tree)
    current = topic
    while current.parent_id:
        associated_topic_ids.add(current.parent_id)
        parent_result = await session.execute(
            select(Topic).where(Topic.id == current.parent_id, Topic.user_id == user_id)
        )
        current = parent_result.scalar_one_or_none()
        if not current:
            break

    # Add related topics (both directions, but only topics)
    outgoing, incoming = await get_topic_related(session, topic_id, user_id)
    for related_topic in outgoing:
        associated_topic_ids.add(related_topic.id)
    for related_topic in incoming:
        associated_topic_ids.add(related_topic.id)

    # 6. Create practice_topics entries
    for assoc_topic_id in associated_topic_ids:
        await session.execute(
            t_practice_topics.insert().values(
                practice_id=new_practice.id,
                topic_id=assoc_topic_id,
            )
        )

    # 7. Delete original topic
    await session.delete(topic)

    await session.commit()

    return new_practice.id
