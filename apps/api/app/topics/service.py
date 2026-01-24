"""Topic business logic and data access."""

from datetime import datetime, timezone as dt_timezone
from typing import Literal

from sqlalchemy import delete, desc, func, insert, or_, select, text, update
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
    FsrsState,
    Review,
    ReviewSession,
    Source,
    Topic,
    t_topic_other_relations,
)


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
        raise NotFoundError("Topic", topic_id)
    return topic


async def search_topics(
    session: AsyncSession,
    user_id: str,
    *,
    addable_as_parent_to: int | None = None,
    addable_as_child_to: int | None = None,
    addable_to_review_session: int | None = None,
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
    return list(result.scalars().all())


async def list_topics(
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
) -> list[Topic]:
    """List topics with optional filters."""
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

    # Create FsrsState if srs_enabled
    if srs_enabled:
        fsrs_state = FsrsState(srs_enabled=True)

        # Handle FSRS inheritance from parent
        if inherit_fsrs and parent_id:
            parent = await session.get(Topic, parent_id)
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
        assert child_name is not None
        new_child = Topic(
            user_id=user_id,
            name=child_name,
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
    parent_topic = await load_topic_with_relationships(session, parent_id, user_id)
    child_topic = await load_topic_with_relationships(session, result_child_id, user_id)

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
    """Get all topics related to this topic. Returns (outgoing, incoming)."""
    # First verify the topic exists and belongs to user
    await get_topic(session, topic_id, user_id)

    # Fetch outgoing (where this topic is 'from', related topic is 'to')
    outgoing_stmt = (
        select(Topic)
        .join(t_topic_other_relations, Topic.id == t_topic_other_relations.c.to_topic_id)
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

    outgoing_topics = list(outgoing_result.scalars().all())
    incoming_topics = list(incoming_result.scalars().all())

    return outgoing_topics, incoming_topics


async def create_topic_relationship(
    session: AsyncSession,
    user_id: str,
    from_topic_id: int,
    *,
    to_topic_id: int | None = None,
    to_topic_name: str | None = None,
    to_topic_notes: str | None = None,
    to_topic_srs_enabled: bool = False,
) -> tuple[Topic, Topic]:
    """Create a directional relationship from one topic to another. Returns (from_topic, to_topic)."""
    # Verify from_topic exists and belongs to user
    await get_topic(session, from_topic_id, user_id)

    # Resolve or create to_topic
    if to_topic_id is not None:
        resolved_to_topic_id = to_topic_id
        await get_topic(session, to_topic_id, user_id)  # Verify to_topic exists
    else:
        # Create new topic from inline data
        assert to_topic_name is not None
        new_to_topic = Topic(
            user_id=user_id,
            name=to_topic_name,
            notes=to_topic_notes or "",
        )

        if to_topic_srs_enabled:
            fsrs_state = FsrsState(srs_enabled=True)
            session.add(fsrs_state)
            await session.flush()
            new_to_topic.fsrs_state_id = fsrs_state.id

        session.add(new_to_topic)
        await session.flush()
        resolved_to_topic_id = new_to_topic.id

    # Check for self-reference
    if from_topic_id == resolved_to_topic_id:
        raise SelfReferenceError("topic")

    # Insert relationship
    stmt = insert(t_topic_other_relations).values(
        from_topic_id=from_topic_id,
        to_topic_id=resolved_to_topic_id,
        inserted_at=datetime.now(dt_timezone.utc),
        updated_at=datetime.now(dt_timezone.utc),
    )
    try:
        await session.execute(stmt)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AlreadyExistsError("Relationship already exists")

    # Re-fetch both topics
    stmt = (
        select(Topic)
        .where(
            Topic.id.in_([from_topic_id, resolved_to_topic_id]), Topic.user_id == user_id
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

    stmt = delete(t_topic_other_relations).where(
        t_topic_other_relations.c.from_topic_id == from_topic_id,
        t_topic_other_relations.c.to_topic_id == to_topic_id,
    )
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
