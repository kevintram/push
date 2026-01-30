"""Source business logic and data access."""

from datetime import datetime, timezone as dt_timezone
from typing import Literal

from sqlalchemy import delete, desc, func, insert, select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    Source,
    SourcePrerequisite,
    Topic,
    t_practice_sources,
    t_practice_topics,
    t_source_topics,
)


async def get_source(session: AsyncSession, source_id: int, user_id: str) -> Source:
    """Get a source or raise NotFoundError."""
    stmt = select(Source).where(Source.id == source_id, Source.user_id == user_id)
    result = await session.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise NotFoundError("Source", source_id)
    return source


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
                SELECT 1 FROM sources d, sources a
                WHERE d.id = :descendant_id
                  AND a.id = :ancestor_id
                  AND d.path <@ a.path
            )
        """),
        {"descendant_id": potential_descendant_id, "ancestor_id": ancestor_id},
    )
    return result.scalar()


async def load_source_with_relationships(
    session: AsyncSession, source_id: int, user_id: str
) -> Source:
    """Load a source with parent, children, topics, and practices relationships."""
    stmt = (
        select(Source)
        .where(Source.id == source_id, Source.user_id == user_id)
        .options(
            selectinload(Source.parent).selectinload(Source.fsrs_state),
            selectinload(Source.children).selectinload(Source.fsrs_state),
            selectinload(Source.topics).selectinload(Topic.fsrs_state),
            selectinload(Source.practices).selectinload(Practice.fsrs_state),
            selectinload(Source.fsrs_state),
        )
    )
    result = await session.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise NotFoundError("Source", source_id)
    return source


async def search_sources(
    session: AsyncSession,
    user_id: str,
    *,
    addable_as_parent_to: int | None = None,
    addable_as_child_to: int | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[Source]:
    """Search sources with various filters."""
    cleaned_query = query.strip() if query else ""
    stmt = select(Source).where(Source.user_id == user_id)

    if addable_as_parent_to is not None:
        # For tree structure: exclude self and all descendants (to prevent cycles)
        # Using ltree: find all sources where target.path <@ candidate.path (target is descendant of candidate)
        descendants_subq = select(Source.id).where(
            Source.user_id == user_id,
            text("""
                EXISTS (
                    SELECT 1 FROM sources candidate, sources target
                    WHERE candidate.id = :parent_candidate_id
                      AND target.id = sources.id
                      AND target.path <@ candidate.path
                )
            """).bindparams(parent_candidate_id=addable_as_parent_to),
        )
        stmt = stmt.where(Source.id.notin_(descendants_subq))

        # Also exclude current parent
        current_parent = select(Source.parent_id).where(
            Source.id == addable_as_parent_to
        )
        stmt = stmt.where(
            (Source.id != current_parent.scalar_subquery())
            | current_parent.scalar_subquery().is_(None)
        )

    if addable_as_child_to is not None:
        # For tree structure: exclude self and all ancestors (to prevent cycles)
        # Using ltree: find all sources where candidate.path <@ target.path (candidate is descendant of target)
        ancestors_subq = select(Source.id).where(
            Source.user_id == user_id,
            text("""
                EXISTS (
                    SELECT 1 FROM sources candidate, sources target
                    WHERE candidate.id = :child_candidate_id
                      AND target.id = sources.id
                      AND candidate.path <@ target.path
                )
            """).bindparams(child_candidate_id=addable_as_child_to),
        )
        stmt = stmt.where(Source.id.notin_(ancestors_subq))

        # Also exclude current children
        children_subq = select(Source.id).where(Source.parent_id == addable_as_child_to)
        stmt = stmt.where(Source.id.notin_(children_subq))

    if cleaned_query:
        like_pattern = f"%{cleaned_query}%"
        stmt = stmt.where(
            (Source.title.ilike(like_pattern)) | (Source.notes.ilike(like_pattern))
        )
        stmt = stmt.order_by(Source.title.asc())
    else:
        stmt = stmt.order_by(Source.updated_at.desc())

    limit = max(1, min(limit, 50))
    stmt = stmt.limit(limit)
    stmt = stmt.options(selectinload(Source.fsrs_state))

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_sources(
    session: AsyncSession,
    user_id: str,
    *,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
    has_stability: bool | None = None,
    srs_enabled: bool | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[Source]:
    """List sources with optional filters."""
    stmt = select(Source).where(Source.user_id == user_id)

    # Apply ordering
    if order == "desc":
        stmt = stmt.order_by(desc(Source.updated_at))
    else:
        stmt = stmt.order_by(Source.updated_at)

    if inboxed is not None:
        stmt = stmt.where(Source.inboxed == inboxed)
    if archived is not None:
        stmt = stmt.where(Source.archived == archived)

    # srs_enabled filter using EXISTS subquery to avoid join conflicts with selectinload
    if srs_enabled is not None:
        if srs_enabled:
            stmt = stmt.where(
                select(FsrsState.id)
                .where(
                    FsrsState.id == Source.fsrs_state_id,
                    FsrsState.srs_enabled.is_(True),
                )
                .exists()
            )
        else:
            stmt = stmt.where(
                (Source.fsrs_state_id.is_(None))
                | select(FsrsState.id)
                .where(
                    FsrsState.id == Source.fsrs_state_id,
                    FsrsState.srs_enabled.is_(False),
                )
                .exists()
            )

    if root is not None and root is True:
        # Root sources have no parent
        stmt = stmt.where(Source.parent_id.is_(None))

    # has_stability filter using EXISTS subquery
    if has_stability is not None:
        if has_stability:
            stmt = stmt.where(
                select(FsrsState.id)
                .where(
                    FsrsState.id == Source.fsrs_state_id,
                    FsrsState.stability.isnot(None),
                )
                .exists()
            )
        else:
            stmt = stmt.where(
                (Source.fsrs_state_id.is_(None))
                | select(FsrsState.id)
                .where(
                    FsrsState.id == Source.fsrs_state_id,
                    FsrsState.stability.is_(None),
                )
                .exists()
            )

    stmt = stmt.options(selectinload(Source.fsrs_state))

    # Apply limit if provided
    if limit is not None:
        stmt = stmt.limit(limit)

    result = await session.execute(stmt)
    return list(result.scalars().unique().all())


async def create_source(
    session: AsyncSession,
    user_id: str,
    *,
    title: str = "",
    notes: str = "",
    parent_id: int | None = None,
    srs_enabled: bool = False,
    inherit_fsrs: bool = False,
    inboxed: bool = False,
    archived: bool = False,
) -> Source:
    """Create a new source."""
    new_source = Source(
        user_id=user_id,
        title=title,
        notes=notes,
        parent_id=parent_id,
        inboxed=inboxed,
        archived=archived,
    )

    # Create FsrsState if srs_enabled
    if srs_enabled:
        fsrs_state = FsrsState(srs_enabled=True)

        # Handle FSRS inheritance from parent
        if inherit_fsrs and parent_id:
            parent = await session.get(Source, parent_id)
            if parent and parent.fsrs_state:
                fsrs_state.inherited_stability = parent.fsrs_state.stability
                fsrs_state.inherited_difficulty = parent.fsrs_state.difficulty
                fsrs_state.inherited_state = parent.fsrs_state.state
                fsrs_state.inherited_step = parent.fsrs_state.step
                fsrs_state.inherited_last_review = parent.fsrs_state.last_reviewed_at

        session.add(fsrs_state)
        await session.flush()
        new_source.fsrs_state_id = fsrs_state.id

    session.add(new_source)
    await session.flush()
    await session.refresh(new_source)

    return new_source


async def get_source_children(
    session: AsyncSession, source_id: int, user_id: str
) -> list[Source]:
    """Get all children of a source."""
    # Verify source exists and belongs to user
    await get_source(session, source_id, user_id)

    # Query children
    stmt = (
        select(Source)
        .where(Source.parent_id == source_id, Source.user_id == user_id)
        .options(selectinload(Source.fsrs_state))
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_source_topics(
    session: AsyncSession, source_id: int, user_id: str
) -> list[Topic]:
    """Get all topics that this source covers."""
    # Verify source exists and belongs to user
    await get_source(session, source_id, user_id)

    # Query topics via junction table
    stmt = (
        select(Topic)
        .join(t_source_topics, Topic.id == t_source_topics.c.topic_id)
        .where(t_source_topics.c.source_id == source_id, Topic.user_id == user_id)
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
    child_title: str | None = None,
    child_notes: str | None = None,
    child_srs_enabled: bool = False,
    child_inherit_fsrs: bool = False,
) -> tuple[Source, Source]:
    """Add or create a child source. Returns (parent, child)."""
    # Verify parent exists
    parent = await get_source(session, parent_id, user_id)

    if child_id is not None:
        child = await get_source(session, child_id, user_id)

        # Check for cycles: child cannot already be an ancestor of parent
        if await is_descendant_of(session, parent_id, child_id):
            raise CycleDetectedError("sources")

        # Check if already a child
        if child.parent_id == parent_id:
            raise AlreadyExistsError("Source is already a child")

        # Set parent
        child.parent_id = parent_id
        result_child_id = child_id
    else:
        # Create new source from inline data
        assert child_title is not None
        new_child = Source(
            user_id=user_id,
            title=child_title,
            notes=child_notes or "",
            parent_id=parent_id,
        )

        # Handle FsrsState creation
        if child_srs_enabled:
            fsrs_state = FsrsState(srs_enabled=True)
            if child_inherit_fsrs and parent.fsrs_state:
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
        result_child_id = new_child.id

    await session.commit()

    # Load both with relationships
    parent_source = await load_source_with_relationships(session, parent_id, user_id)
    child_source = await load_source_with_relationships(
        session, result_child_id, user_id
    )

    return parent_source, child_source


async def remove_child(
    session: AsyncSession, parent_id: int, child_id: int, user_id: str
) -> Source:
    """Remove a child from a parent (sets child's parent_id to null). Returns parent."""
    await get_source(session, parent_id, user_id)  # Verify parent exists
    child = await get_source(session, child_id, user_id)

    if child.parent_id != parent_id:
        raise NotFoundError("Child relationship")

    # Remove parent reference (orphan the child)
    child.parent_id = None
    await session.commit()

    return await load_source_with_relationships(session, parent_id, user_id)


async def add_source_topic(
    session: AsyncSession, source_id: int, topic_id: int, user_id: str
) -> tuple[Source, Topic]:
    """Add a topic that this source covers. Returns (source, topic)."""
    source = await get_source(session, source_id, user_id)

    # Verify topic exists and belongs to user
    topic_result = await session.execute(
        select(Topic)
        .where(Topic.id == topic_id, Topic.user_id == user_id)
        .options(selectinload(Topic.fsrs_state))
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic", topic_id)

    # Insert relationship
    stmt = insert(t_source_topics).values(
        source_id=source_id,
        topic_id=topic_id,
        inserted_at=datetime.now(dt_timezone.utc),
        updated_at=datetime.now(dt_timezone.utc),
    )
    try:
        await session.execute(stmt)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AlreadyExistsError("Source already covers this topic")

    # Refresh source to get updated counts
    await session.refresh(source)

    return source, topic


async def remove_source_topic(
    session: AsyncSession, source_id: int, topic_id: int, user_id: str
) -> None:
    """Remove a topic that this source covers."""
    # Verify source belongs to user
    await get_source(session, source_id, user_id)

    stmt = delete(t_source_topics).where(
        t_source_topics.c.source_id == source_id,
        t_source_topics.c.topic_id == topic_id,
    )
    result = await session.execute(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise NotFoundError("Source-topic relationship")


async def update_source(
    session: AsyncSession,
    source_id: int,
    user_id: str,
    *,
    title: str | None = None,
    notes: str | None = None,
    parent_id: int | None = ...,  # Use ... as sentinel to distinguish from None
    srs_enabled: bool | None = None,
    inboxed: bool | None = None,
    archived: bool | None = None,
) -> Source:
    """Update a source using PATCH semantics."""
    source = await get_source(session, source_id, user_id)

    # Handle parent_id change with cycle detection
    if parent_id is not ...:
        if parent_id is not None:
            # Verify new parent exists
            await get_source(session, parent_id, user_id)
            # Check for cycles: new parent cannot be a descendant of this source
            if await is_descendant_of(session, parent_id, source_id):
                raise CycleDetectedError("sources")
        source.parent_id = parent_id

    # Handle srs_enabled toggle
    if srs_enabled is not None:
        if srs_enabled and source.fsrs_state_id is None:
            # Create fsrs_state
            fsrs_state = FsrsState(srs_enabled=True)
            session.add(fsrs_state)
            await session.flush()
            source.fsrs_state_id = fsrs_state.id
        elif not srs_enabled and source.fsrs_state:
            source.fsrs_state.srs_enabled = False

    # Apply remaining updates
    if title is not None:
        source.title = title
    if notes is not None:
        source.notes = notes
    if inboxed is not None:
        source.inboxed = inboxed
    if archived is not None:
        source.archived = archived

    await session.commit()
    return await load_source_with_relationships(session, source_id, user_id)


async def delete_source(
    session: AsyncSession,
    source_id: int,
    user_id: str,
    *,
    handle_children_by: ChildHandlingStrategy | None = None,
) -> None:
    """Delete a source. If source has children, must specify handle_children_by strategy."""
    source = await get_source(session, source_id, user_id)

    # Check if source has children
    children_count = await session.scalar(
        select(func.count()).select_from(Source).where(Source.parent_id == source_id)
    )

    if children_count > 0:
        if handle_children_by is None:
            raise HasChildrenError("Source", children_count)

        if handle_children_by == ChildHandlingStrategy.DELETE:
            # Recursively delete all descendants using ltree
            await session.execute(
                delete(Source).where(
                    text(
                        "sources.path <@ (SELECT path FROM sources WHERE id = :delete_source_id)"
                    ).bindparams(delete_source_id=source_id)
                )
            )
        elif handle_children_by == ChildHandlingStrategy.ORPHAN:
            # Set children's parent_id to null (make them root sources)
            await session.execute(
                update(Source)
                .where(Source.parent_id == source_id)
                .values(parent_id=None)
            )
        elif handle_children_by == ChildHandlingStrategy.REPARENT:
            if source.parent_id is None:
                raise BadRequestError(
                    "Cannot reparent: source has no parent (is a root source)"
                )
            # Set children's parent_id to grandparent
            await session.execute(
                update(Source)
                .where(Source.parent_id == source_id)
                .values(parent_id=source.parent_id)
            )

        # Now delete the source itself (if not already deleted by recursive delete)
        if handle_children_by != ChildHandlingStrategy.DELETE:
            await session.execute(
                delete(Source).where(Source.id == source_id, Source.user_id == user_id)
            )
    else:
        # No children, just delete
        await session.execute(
            delete(Source).where(Source.id == source_id, Source.user_id == user_id)
        )

    await session.commit()


# ===== Entity Relations =====


async def get_source_related_entities(
    session: AsyncSession, source_id: int, user_id: str
) -> tuple[list[dict], list[dict]]:
    """Get outgoing and incoming entity relations for a source.

    Returns:
        Tuple of (outgoing_relations, incoming_relations) where each item is a dict
        containing full entity data with an entity_type discriminator.
    """
    from app.schemas.sources import SourceSummaryRead
    from app.schemas.topics import TopicSummaryRead

    # First verify the source exists and belongs to user
    await get_source(session, source_id, user_id)

    # Fetch outgoing relations (from this source to other entities)
    outgoing_stmt = (
        select(EntityRelation)
        .where(EntityRelation.from_source_id == source_id)
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
            # Verify topic belongs to user
            if rel.to_topic and rel.to_topic.user_id == user_id:
                topic_data = TopicSummaryRead.model_validate(rel.to_topic).model_dump()
                topic_data["entity_type"] = "topic"
                outgoing.append(topic_data)
        elif rel.to_source_id:
            # Verify source belongs to user
            if rel.to_source and rel.to_source.user_id == user_id:
                source_data = SourceSummaryRead.model_validate(
                    rel.to_source
                ).model_dump()
                source_data["entity_type"] = "source"
                outgoing.append(source_data)

    # Fetch incoming relations (from other entities to this source)
    incoming_stmt = (
        select(EntityRelation)
        .where(EntityRelation.to_source_id == source_id)
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


async def add_related_entity_to_source(
    session: AsyncSession,
    source_id: int,
    user_id: str,
    *,
    to_entity_type: str,
    to_entity_id: int,
) -> None:
    """Add a related entity (topic or source) to this source."""
    # Verify source exists and belongs to user
    await get_source(session, source_id, user_id)

    if to_entity_type == "topic":
        # Verify target topic exists and belongs to user
        topic_result = await session.execute(
            select(Topic).where(Topic.id == to_entity_id, Topic.user_id == user_id)
        )
        if not topic_result.scalar_one_or_none():
            raise NotFoundError("Topic", to_entity_id)

        relation = EntityRelation(
            from_source_id=source_id,
            to_topic_id=to_entity_id,
        )
    elif to_entity_type == "source":
        # Verify target source exists and belongs to user
        await get_source(session, to_entity_id, user_id)

        # Check for self-reference
        if source_id == to_entity_id:
            raise SelfReferenceError("source")

        relation = EntityRelation(
            from_source_id=source_id,
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


async def remove_related_entity_from_source(
    session: AsyncSession,
    source_id: int,
    user_id: str,
    *,
    entity_type: str,
    entity_id: int,
) -> None:
    """Remove a related entity (topic or source) from this source."""
    # Verify source exists and belongs to user
    await get_source(session, source_id, user_id)

    if entity_type == "topic":
        stmt = delete(EntityRelation).where(
            EntityRelation.from_source_id == source_id,
            EntityRelation.to_topic_id == entity_id,
        )
    elif entity_type == "source":
        stmt = delete(EntityRelation).where(
            EntityRelation.from_source_id == source_id,
            EntityRelation.to_source_id == entity_id,
        )
    else:
        raise BadRequestError(f"Invalid entity_type: {entity_type}")

    result = await session.execute(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise NotFoundError("Relationship")


# ===== Source Prerequisites =====


async def get_source_prerequisites(
    session: AsyncSession, source_id: int, user_id: str
) -> list[SourcePrerequisite]:
    """Get all prerequisites for this source."""
    # Verify source exists and belongs to user
    await get_source(session, source_id, user_id)

    stmt = (
        select(SourcePrerequisite)
        .where(SourcePrerequisite.source_id == source_id)
        .options(
            selectinload(SourcePrerequisite.prereq_topic).selectinload(
                Topic.fsrs_state
            ),
            selectinload(SourcePrerequisite.prereq_source).selectinload(
                Source.fsrs_state
            ),
        )
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def add_source_prerequisite(
    session: AsyncSession,
    source_id: int,
    user_id: str,
    *,
    prereq_entity_type: str,
    prereq_entity_id: int,
) -> None:
    """Add a prerequisite (topic or source) to this source."""
    # Verify source exists and belongs to user
    await get_source(session, source_id, user_id)

    if prereq_entity_type == "topic":
        # Verify target topic exists and belongs to user
        topic_result = await session.execute(
            select(Topic).where(Topic.id == prereq_entity_id, Topic.user_id == user_id)
        )
        if not topic_result.scalar_one_or_none():
            raise NotFoundError("Topic", prereq_entity_id)

        prereq = SourcePrerequisite(
            source_id=source_id,
            prereq_topic_id=prereq_entity_id,
        )
    elif prereq_entity_type == "source":
        # Verify target source exists and belongs to user
        await get_source(session, prereq_entity_id, user_id)

        # Check for self-reference
        if source_id == prereq_entity_id:
            raise SelfReferenceError("source")

        prereq = SourcePrerequisite(
            source_id=source_id,
            prereq_source_id=prereq_entity_id,
        )
    else:
        raise BadRequestError(f"Invalid prereq_entity_type: {prereq_entity_type}")

    session.add(prereq)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AlreadyExistsError("Prerequisite already exists")


async def remove_source_prerequisite(
    session: AsyncSession,
    source_id: int,
    user_id: str,
    *,
    entity_type: str,
    entity_id: int,
) -> None:
    """Remove a prerequisite from this source."""
    # Verify source exists and belongs to user
    await get_source(session, source_id, user_id)

    if entity_type == "topic":
        stmt = delete(SourcePrerequisite).where(
            SourcePrerequisite.source_id == source_id,
            SourcePrerequisite.prereq_topic_id == entity_id,
        )
    elif entity_type == "source":
        stmt = delete(SourcePrerequisite).where(
            SourcePrerequisite.source_id == source_id,
            SourcePrerequisite.prereq_source_id == entity_id,
        )
    else:
        raise BadRequestError(f"Invalid entity_type: {entity_type}")

    result = await session.execute(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise NotFoundError("Prerequisite")


# ===== Source Practices =====


async def get_source_practices(
    session: AsyncSession, source_id: int, user_id: str
) -> list[Practice]:
    """Get all practices linked to a source."""
    await get_source(session, source_id, user_id)
    stmt = (
        select(Practice)
        .join(t_practice_sources, Practice.id == t_practice_sources.c.practice_id)
        .where(t_practice_sources.c.source_id == source_id)
        .options(selectinload(Practice.fsrs_state))
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def add_practice_to_source(
    session: AsyncSession, source_id: int, practice_id: int, user_id: str
) -> None:
    """Link a practice to a source."""
    # Verify source exists and belongs to user
    await get_source(session, source_id, user_id)

    # Verify practice exists and belongs to user
    stmt = select(Practice).where(
        Practice.id == practice_id, Practice.user_id == user_id
    )
    result = await session.execute(stmt)
    practice = result.scalar_one_or_none()
    if practice is None:
        raise NotFoundError("Practice", practice_id)

    # Check if already linked
    stmt = select(t_practice_sources).where(
        t_practice_sources.c.source_id == source_id,
        t_practice_sources.c.practice_id == practice_id,
    )
    result = await session.execute(stmt)
    if result.first() is not None:
        raise ConflictError("Practice is already linked to this source")

    await session.execute(
        t_practice_sources.insert().values(source_id=source_id, practice_id=practice_id)
    )
    await session.commit()


async def remove_practice_from_source(
    session: AsyncSession, source_id: int, practice_id: int, user_id: str
) -> None:
    """Remove a practice link from a source."""
    await get_source(session, source_id, user_id)

    result = await session.execute(
        delete(t_practice_sources).where(
            t_practice_sources.c.source_id == source_id,
            t_practice_sources.c.practice_id == practice_id,
        )
    )
    if result.rowcount == 0:
        raise NotFoundError("Source-Practice link", practice_id)
    await session.commit()


# ===== Source Conversions =====


async def check_source_convertible_to_practice(
    session: AsyncSession, source_id: int, user_id: str
) -> tuple[bool, str | None]:
    """Check if a source can be converted to a practice.

    Returns (can_convert, error_reason).
    Fails if source has children.
    """
    children_count = await session.execute(
        select(func.count())
        .select_from(Source)
        .where(Source.parent_id == source_id, Source.user_id == user_id)
    )
    if children_count.scalar() > 0:
        return False, "source has children"

    return True, None


async def convert_source_to_topic(
    session: AsyncSession, source_id: int, user_id: str
) -> int:
    """Convert a source (and its subtree) to a topic hierarchy.

    Returns the new root topic ID.

    Transformation:
    - Source title -> Topic name
    - Source notes -> Topic notes
    - Source FSRS state -> New Topic FSRS state (all 11 fields)
    - Source flags -> Topic flags
    - Child sources -> Child topics (recursive)
    - Entity relations -> Entity relations (from_topic_id/to_topic_id)
    - Linked practices -> practice_topics entries
    - source_topics -> entity_relations (new topic related to covered topics)
    - source_prerequisites -> entity_relations

    No blocking conditions.
    """
    # 1. Verify source exists
    await get_source(session, source_id, user_id)

    # 2. Get all sources in subtree (using ltree path)
    subtree_stmt = (
        select(Source)
        .where(
            Source.user_id == user_id,
            text(
                "sources.path <@ (SELECT path FROM sources WHERE id = :root_id)"
            ).bindparams(root_id=source_id),
        )
        .options(
            selectinload(Source.fsrs_state),
            selectinload(Source.practices),
        )
    )
    result = await session.execute(subtree_stmt)
    all_sources = list(result.scalars().all())

    # 3. Build source_id -> new_topic mapping
    source_to_topic: dict[int, Topic] = {}

    # Sort by path length to process parents before children
    all_sources.sort(key=lambda s: len(s.path or ""))

    for source in all_sources:
        # Create new FSRS state if source had one
        new_fsrs_state_id = None
        if source.fsrs_state:
            new_fsrs = FsrsState(
                srs_enabled=source.fsrs_state.srs_enabled,
                stability=source.fsrs_state.stability,
                difficulty=source.fsrs_state.difficulty,
                state=source.fsrs_state.state,
                step=source.fsrs_state.step,
                last_reviewed_at=source.fsrs_state.last_reviewed_at,
                inherited_stability=source.fsrs_state.inherited_stability,
                inherited_difficulty=source.fsrs_state.inherited_difficulty,
                inherited_state=source.fsrs_state.inherited_state,
                inherited_step=source.fsrs_state.inherited_step,
                inherited_last_review=source.fsrs_state.inherited_last_review,
            )
            session.add(new_fsrs)
            await session.flush()
            new_fsrs_state_id = new_fsrs.id

        # Determine parent topic ID
        parent_topic_id = None
        if source.parent_id and source.parent_id in source_to_topic:
            parent_topic_id = source_to_topic[source.parent_id].id

        # Create topic
        new_topic = Topic(
            user_id=user_id,
            name=source.title,
            notes=source.notes,
            parent_id=parent_topic_id,
            fsrs_state_id=new_fsrs_state_id,
            archived=source.archived,
            inboxed=source.inboxed,
        )
        session.add(new_topic)
        await session.flush()

        source_to_topic[source.id] = new_topic

        # Migrate practices to new topic
        for practice in source.practices:
            await session.execute(
                t_practice_topics.insert().values(
                    practice_id=practice.id,
                    topic_id=new_topic.id,
                )
            )

        # Migrate reviews from source to new topic
        await session.execute(
            update(Review)
            .where(Review.source_id == source.id)
            .values(topic_id=new_topic.id, source_id=None)
        )

    # 4. Migrate entity relations
    for source in all_sources:
        new_topic = source_to_topic[source.id]

        # Get outgoing relations (from this source)
        outgoing = await session.execute(
            select(EntityRelation).where(EntityRelation.from_source_id == source.id)
        )
        for rel in outgoing.scalars():
            new_to_topic_id = rel.to_topic_id
            new_to_source_id = rel.to_source_id

            if rel.to_source_id and rel.to_source_id in source_to_topic:
                # Target source was also converted, point to new topic
                new_to_topic_id = source_to_topic[rel.to_source_id].id
                new_to_source_id = None

            new_rel = EntityRelation(
                from_topic_id=new_topic.id,
                to_topic_id=new_to_topic_id,
                to_source_id=new_to_source_id,
            )
            session.add(new_rel)

        # Get incoming relations (to this source)
        incoming = await session.execute(
            select(EntityRelation).where(EntityRelation.to_source_id == source.id)
        )
        for rel in incoming.scalars():
            # Skip if from_source is in our subtree (will be handled by outgoing)
            if rel.from_source_id and rel.from_source_id in source_to_topic:
                continue

            new_rel = EntityRelation(
                from_topic_id=rel.from_topic_id,
                from_source_id=rel.from_source_id,
                to_topic_id=new_topic.id,
            )
            session.add(new_rel)

    # 5. Migrate source_topics -> entity_relations
    for source in all_sources:
        new_topic = source_to_topic[source.id]

        st_result = await session.execute(
            select(t_source_topics.c.topic_id).where(
                t_source_topics.c.source_id == source.id
            )
        )
        for row in st_result:
            covered_topic_id = row[0]
            new_rel = EntityRelation(
                from_topic_id=new_topic.id,
                to_topic_id=covered_topic_id,
            )
            session.add(new_rel)

    # 6. Migrate source_prerequisites -> entity_relations
    for source in all_sources:
        new_topic = source_to_topic[source.id]

        prereqs = await session.execute(
            select(SourcePrerequisite).where(SourcePrerequisite.source_id == source.id)
        )
        for prereq in prereqs.scalars():
            to_topic_id = prereq.prereq_topic_id
            to_source_id = prereq.prereq_source_id

            # If prereq points to a source in the subtree, point to new topic
            if prereq.prereq_source_id and prereq.prereq_source_id in source_to_topic:
                to_topic_id = source_to_topic[prereq.prereq_source_id].id
                to_source_id = None

            new_rel = EntityRelation(
                from_topic_id=new_topic.id,
                to_topic_id=to_topic_id,
                to_source_id=to_source_id,
            )
            session.add(new_rel)

    # 7. Delete original sources (cascade will clean up old relations)
    # Delete in reverse order (children first) to respect FK constraints
    all_sources.sort(key=lambda s: len(s.path or ""), reverse=True)
    for source in all_sources:
        await session.delete(source)

    await session.commit()

    return source_to_topic[source_id].id


async def convert_source_to_practice(
    session: AsyncSession, source_id: int, user_id: str
) -> int:
    """Convert a source to a practice.

    Returns the new practice ID.

    Transformation:
    - Source title -> Practice prompt
    - Source notes -> Practice answer
    - Source FSRS state -> New Practice FSRS state (core 6 fields)
    - Source flags -> Practice flags
    - source_topics -> practice_topics
    - Reviews migrated

    Lost: entity relations, prerequisites, practice_sources entries
    Blocked if: has children
    """
    # 1. Verify source exists and load relationships
    source = await load_source_with_relationships(session, source_id, user_id)

    # 2. Check convertibility
    can_convert, reason = await check_source_convertible_to_practice(
        session, source_id, user_id
    )
    if not can_convert:
        raise ConversionBlockedError(reason)

    # 3. Create new FSRS state if needed
    new_fsrs_state_id = None
    if source.fsrs_state:
        new_fsrs = FsrsState(
            srs_enabled=source.fsrs_state.srs_enabled,
            stability=source.fsrs_state.stability,
            difficulty=source.fsrs_state.difficulty,
            state=source.fsrs_state.state,
            step=source.fsrs_state.step,
            last_reviewed_at=source.fsrs_state.last_reviewed_at,
        )
        session.add(new_fsrs)
        await session.flush()
        new_fsrs_state_id = new_fsrs.id

    # 4. Create practice
    new_practice = Practice(
        user_id=user_id,
        prompt=source.title,
        answer=source.notes,
        fsrs_state_id=new_fsrs_state_id,
        archived=source.archived,
        inboxed=source.inboxed,
    )
    session.add(new_practice)
    await session.flush()

    # 5. Migrate reviews
    await session.execute(
        update(Review)
        .where(Review.source_id == source_id)
        .values(practice_id=new_practice.id, source_id=None)
    )

    # 6. Migrate source_topics -> practice_topics
    st_result = await session.execute(
        select(t_source_topics.c.topic_id).where(
            t_source_topics.c.source_id == source_id
        )
    )
    for row in st_result:
        await session.execute(
            t_practice_topics.insert().values(
                practice_id=new_practice.id,
                topic_id=row[0],
            )
        )

    # 7. Delete original source
    await session.delete(source)

    await session.commit()

    return new_practice.id
