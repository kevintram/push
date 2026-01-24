from enum import Enum
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone as dt_timezone

from sqlalchemy import select, update, delete, desc, insert, func, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import Literal

from app.dependencies import SessionDep, UserIdDep
from app.models import Source, Topic, FsrsState, t_source_topics
from app.schemas import (
    SourceRead,
    SourceCreate,
    SourceUpdate,
    SourceSummaryRead,
    SourceDetailRead,
    SourceChildRelationshipCreate,
    SourceRelationshipResponse,
    SourceTopicAdd,
    SourceTopicResponse,
    TopicSummaryRead,
)

router = APIRouter()


class ChildHandlingStrategy(str, Enum):
    """Strategy for handling children when deleting a source."""

    DELETE = "delete"
    ORPHAN = "orphan"
    REPARENT = "reparent"


async def is_source_descendant_of(
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
                SELECT 1 FROM sources d, sources a
                WHERE d.id = :descendant_id
                  AND a.id = :ancestor_id
                  AND d.path <@ a.path
            )
        """),
        {"descendant_id": potential_descendant_id, "ancestor_id": ancestor_id},
    )
    return result.scalar()


async def get_source_or_404(
    session: AsyncSession, source_id: int, user_id: str
) -> Source:
    """Get a source or raise 404 if not found."""
    stmt = select(Source).where(Source.id == source_id, Source.user_id == user_id)
    result = await session.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


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
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.get("/sources/search/", tags=["sources"])
async def search_sources(
    session: SessionDep,
    user_id: UserIdDep,
    addable_as_parent_to: int | None = None,
    addable_as_child_to: int | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[SourceSummaryRead]:
    """Search for sources with various filters."""
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
    return result.scalars().all()


@router.get("/sources/", tags=["sources"])
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
    return result.scalars().unique().all()


@router.get("/sources/{source_id}/", tags=["sources"])
async def read_source(
    session: SessionDep, user_id: UserIdDep, source_id: int
) -> SourceDetailRead:
    """Get a source with full relationships."""
    return await load_source_with_relationships(session, source_id, user_id)


@router.get("/sources/{source_id}/children/", tags=["sources"])
async def read_source_children(
    session: SessionDep, user_id: UserIdDep, source_id: int
) -> list[SourceSummaryRead]:
    """Get all children of a source."""
    # Verify source exists and belongs to user
    await get_source_or_404(session, source_id, user_id)

    # Query children
    stmt = (
        select(Source)
        .where(Source.parent_id == source_id, Source.user_id == user_id)
        .options(selectinload(Source.fsrs_state))
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/sources/{source_id}/topics/", tags=["sources"])
async def read_source_topics(
    session: SessionDep, user_id: UserIdDep, source_id: int
) -> list[TopicSummaryRead]:
    """Get all topics that this source covers."""
    # Verify source exists and belongs to user
    await get_source_or_404(session, source_id, user_id)

    # Query topics via junction table
    stmt = (
        select(Topic)
        .join(t_source_topics, Topic.id == t_source_topics.c.topic_id)
        .where(t_source_topics.c.source_id == source_id, Topic.user_id == user_id)
        .options(selectinload(Topic.fsrs_state))
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/sources/", tags=["sources"])
async def insert_source(
    source: SourceCreate, session: SessionDep, user_id: UserIdDep
) -> SourceRead:
    """Create a new source."""
    # Extract fields for Source model (exclude srs_enabled and inherit_fsrs which are for FsrsState)
    source_data = source.model_dump(exclude={"srs_enabled", "inherit_fsrs"})
    new_source = Source(**source_data, user_id=user_id)

    # Create FsrsState if srs_enabled
    if source.srs_enabled:
        fsrs_state = FsrsState(srs_enabled=True)

        # Handle FSRS inheritance from parent
        if source.inherit_fsrs and source.parent_id:
            parent = await session.get(Source, source.parent_id)
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


@router.post("/sources/{parent_id}/children/", tags=["sources"])
async def insert_child(
    parent_id: int,
    payload: SourceChildRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> SourceRelationshipResponse:
    """Add an existing source as a child or create a new child source."""
    # Verify parent exists
    parent = await get_source_or_404(session, parent_id, user_id)

    # Resolve or create child source
    if payload.child_id is not None:
        child = await get_source_or_404(session, payload.child_id, user_id)

        # Check for cycles: child cannot already be an ancestor of parent
        if await is_source_descendant_of(session, parent_id, payload.child_id):
            raise HTTPException(
                status_code=409,
                detail="Cannot add ancestor as child: would create cycle",
            )

        # Check if already a child
        if child.parent_id == parent_id:
            raise HTTPException(status_code=409, detail="Source is already a child")

        # Set parent
        child.parent_id = parent_id
        child_id = payload.child_id
    else:
        # Create new source from inline data
        assert payload.child is not None
        child_data = payload.child.model_dump(exclude={"srs_enabled", "inherit_fsrs"})
        child_data["parent_id"] = parent_id
        new_child = Source(**child_data, user_id=user_id)

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
    parent_source = await load_source_with_relationships(session, parent_id, user_id)
    child_source = await load_source_with_relationships(session, child_id, user_id)

    return SourceRelationshipResponse(parent=parent_source, child=child_source)


@router.delete("/sources/{parent_id}/children/{child_id}/", tags=["sources"])
async def delete_child(
    parent_id: int,
    child_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> SourceDetailRead:
    """Remove a child from a parent (sets child's parent_id to null)."""
    await get_source_or_404(session, parent_id, user_id)  # Verify parent exists
    child = await get_source_or_404(session, child_id, user_id)

    if child.parent_id != parent_id:
        raise HTTPException(status_code=404, detail="Child relationship not found")

    # Remove parent reference (orphan the child)
    child.parent_id = None
    await session.commit()

    return await load_source_with_relationships(session, parent_id, user_id)


@router.post("/sources/{source_id}/topics/", tags=["sources"])
async def add_source_topic(
    source_id: int,
    payload: SourceTopicAdd,
    session: SessionDep,
    user_id: UserIdDep,
) -> SourceTopicResponse:
    """Add a topic that this source covers."""
    source = await get_source_or_404(session, source_id, user_id)

    # Verify topic exists and belongs to user
    topic_result = await session.execute(
        select(Topic)
        .where(Topic.id == payload.topic_id, Topic.user_id == user_id)
        .options(selectinload(Topic.fsrs_state))
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Insert relationship
    stmt = insert(t_source_topics).values(
        source_id=source_id,
        topic_id=payload.topic_id,
        inserted_at=datetime.now(dt_timezone.utc),
        updated_at=datetime.now(dt_timezone.utc),
    )
    try:
        await session.execute(stmt)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Source already covers this topic")

    # Refresh source to get updated counts
    await session.refresh(source)

    return SourceTopicResponse(source=source, topic=topic)


@router.delete("/sources/{source_id}/topics/{topic_id}/", tags=["sources"])
async def remove_source_topic(
    source_id: int,
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    """Remove a topic that this source covers."""
    # Verify source belongs to user
    await get_source_or_404(session, source_id, user_id)

    stmt = delete(t_source_topics).where(
        t_source_topics.c.source_id == source_id,
        t_source_topics.c.topic_id == topic_id,
    )
    result = await session.execute(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404, detail="Source-topic relationship not found"
        )


@router.patch("/sources/{source_id}/", tags=["sources"])
async def update_source(
    source_id: int, payload: SourceUpdate, session: SessionDep, user_id: UserIdDep
) -> SourceDetailRead:
    """Update a source using PATCH semantics."""
    source = await get_source_or_404(session, source_id, user_id)

    update_data = payload.model_dump(exclude_unset=True)

    # Handle parent_id change with cycle detection
    if "parent_id" in update_data:
        new_parent_id = update_data["parent_id"]
        if new_parent_id is not None:
            # Verify new parent exists
            await get_source_or_404(session, new_parent_id, user_id)
            # Check for cycles: new parent cannot be a descendant of this source
            if await is_source_descendant_of(session, new_parent_id, source_id):
                raise HTTPException(409, "Cannot set parent: would create cycle")
        source.parent_id = new_parent_id
        del update_data["parent_id"]

    # Handle srs_enabled toggle
    if "srs_enabled" in update_data:
        if update_data["srs_enabled"] and source.fsrs_state_id is None:
            # Create fsrs_state
            fsrs_state = FsrsState(srs_enabled=True)
            session.add(fsrs_state)
            await session.flush()
            source.fsrs_state_id = fsrs_state.id
        elif not update_data["srs_enabled"] and source.fsrs_state:
            source.fsrs_state.srs_enabled = False
        del update_data["srs_enabled"]

    # Apply remaining updates
    for key, value in update_data.items():
        setattr(source, key, value)

    await session.commit()
    return await load_source_with_relationships(session, source_id, user_id)


@router.delete("/sources/{source_id}/", tags=["sources"])
async def delete_source(
    source_id: int,
    session: SessionDep,
    user_id: UserIdDep,
    handle_children_by: ChildHandlingStrategy | None = Query(default=None),
):
    """Delete a source. If source has children, must specify handle_children_by strategy."""
    source = await get_source_or_404(session, source_id, user_id)

    # Check if source has children
    children_count = await session.scalar(
        select(func.count()).select_from(Source).where(Source.parent_id == source_id)
    )

    if children_count > 0:
        if handle_children_by is None:
            raise HTTPException(
                status_code=409,
                detail=f"Source has {children_count} children. Specify handle_children_by: delete, orphan, or reparent",
            )

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
                raise HTTPException(
                    status_code=400,
                    detail="Cannot reparent: source has no parent (is a root source)",
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
