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
    CycleDetectedError,
    HasChildrenError,
    NotFoundError,
    SelfReferenceError,
)
from app.models import (
    EntityRelation,
    FsrsState,
    Source,
    SourcePrerequisite,
    Topic,
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
    """Load a source with parent, children, and topics relationships."""
    stmt = (
        select(Source)
        .where(Source.id == source_id, Source.user_id == user_id)
        .options(
            selectinload(Source.parent).selectinload(Source.fsrs_state),
            selectinload(Source.children).selectinload(Source.fsrs_state),
            selectinload(Source.topics).selectinload(Topic.fsrs_state),
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
