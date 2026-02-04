"""Practice business logic and data access."""

from datetime import datetime, timezone as dt_timezone
from typing import Literal

from sqlalchemy import cast, delete, desc, func, insert, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.types import TIMESTAMP

from app.exceptions import AlreadyExistsError, NotFoundError
from app.models import (
    FsrsState,
    Practice,
    Review,
    Source,
    Topic,
    t_practice_sources,
    t_practice_topics,
    t_source_topics,
)
from app.models.entity_relations import EntityRelation
from app.utils.fsrs import apply_inherited_fsrs


async def get_practice(
    session: AsyncSession, practice_id: int, user_id: str
) -> Practice:
    """Get a practice or raise NotFoundError."""
    stmt = (
        select(Practice)
        .where(Practice.id == practice_id, Practice.user_id == user_id)
        .options(selectinload(Practice.fsrs_state))
    )
    result = await session.execute(stmt)
    practice = result.scalar_one_or_none()
    if not practice:
        raise NotFoundError("Practice", practice_id)
    return practice


async def load_practice_with_relationships(
    session: AsyncSession, practice_id: int, user_id: str
) -> Practice:
    """Load a practice with topics and sources relationships."""
    stmt = (
        select(Practice)
        .where(Practice.id == practice_id, Practice.user_id == user_id)
        .options(
            selectinload(Practice.topics).selectinload(Topic.fsrs_state),
            selectinload(Practice.sources).selectinload(Source.fsrs_state),
            selectinload(Practice.fsrs_state),
        )
    )
    result = await session.execute(stmt)
    practice = result.scalar_one_or_none()
    if not practice:
        raise NotFoundError("Practice", practice_id)
    return practice


async def search_practices(
    session: AsyncSession,
    user_id: str,
    *,
    query: str | None = None,
    limit: int = 10,
) -> list[Practice]:
    """Search practices by prompt or answer."""
    cleaned_query = query.strip() if query else ""
    stmt = select(Practice).where(
        Practice.user_id == user_id, Practice.archived.is_(False)
    )

    if cleaned_query:
        like_pattern = f"%{cleaned_query}%"
        stmt = stmt.where(
            (Practice.prompt.ilike(like_pattern))
            | (Practice.answer.ilike(like_pattern))
        )
        stmt = stmt.order_by(Practice.prompt.asc())
    else:
        stmt = stmt.order_by(Practice.updated_at.desc())

    limit = max(1, min(limit, 50))
    stmt = stmt.limit(limit)
    stmt = stmt.options(selectinload(Practice.fsrs_state))

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_practices(
    session: AsyncSession,
    user_id: str,
    *,
    query: str | None = None,
    inboxed: bool | None = None,
    archived: bool | None = None,
    has_stability: bool | None = None,
    srs_enabled: bool | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
    order_by: Literal["updated_at", "recent_activity"] = "updated_at",
) -> list[Practice]:
    """List practices with optional filters."""
    stmt = select(Practice).where(Practice.user_id == user_id)

    # Text search filter
    if query:
        like_pattern = f"%{query.strip()}%"
        stmt = stmt.where(
            (Practice.prompt.ilike(like_pattern))
            | (Practice.answer.ilike(like_pattern))
        )

    # Apply ordering
    recent_activity = None
    if order_by == "recent_activity":
        last_reviewed_at = (
            select(FsrsState.last_reviewed_at)
            .where(FsrsState.id == Practice.fsrs_state_id)
            .scalar_subquery()
        )
        last_reviewed_ts = cast(last_reviewed_at, TIMESTAMP(timezone=True))
        recent_activity = func.greatest(
            Practice.updated_at,
            func.coalesce(last_reviewed_ts, Practice.updated_at),
        )
        if order == "desc":
            stmt = stmt.order_by(desc(recent_activity))
        else:
            stmt = stmt.order_by(recent_activity)
    else:
        if order == "desc":
            stmt = stmt.order_by(desc(Practice.updated_at))
        else:
            stmt = stmt.order_by(Practice.updated_at)

    if inboxed is not None:
        stmt = stmt.where(Practice.inboxed == inboxed)
    if archived is not None:
        stmt = stmt.where(Practice.archived == archived)

    # srs_enabled filter using EXISTS subquery
    if srs_enabled is not None:
        if srs_enabled:
            stmt = stmt.where(
                select(FsrsState.id)
                .where(
                    FsrsState.id == Practice.fsrs_state_id,
                    FsrsState.srs_enabled.is_(True),
                )
                .exists()
            )
        else:
            stmt = stmt.where(
                (Practice.fsrs_state_id.is_(None))
                | select(FsrsState.id)
                .where(
                    FsrsState.id == Practice.fsrs_state_id,
                    FsrsState.srs_enabled.is_(False),
                )
                .exists()
            )

    # has_stability filter using EXISTS subquery
    if has_stability is not None:
        if has_stability:
            stmt = stmt.where(
                select(FsrsState.id)
                .where(
                    FsrsState.id == Practice.fsrs_state_id,
                    FsrsState.stability.isnot(None),
                )
                .exists()
            )
        else:
            stmt = stmt.where(
                (Practice.fsrs_state_id.is_(None))
                | select(FsrsState.id)
                .where(
                    FsrsState.id == Practice.fsrs_state_id,
                    FsrsState.stability.is_(None),
                )
                .exists()
            )

    stmt = stmt.options(selectinload(Practice.fsrs_state))

    # Apply limit if provided
    if limit is not None:
        stmt = stmt.limit(limit)

    if recent_activity is not None:
        stmt = stmt.add_columns(recent_activity.label("recent_activity_at"))

    result = await session.execute(stmt)
    if recent_activity is not None:
        practices: list[Practice] = []
        for practice, activity_at in result.all():
            practice.recent_activity_at = activity_at
            practices.append(practice)
        return practices

    return list(result.scalars().unique().all())


async def create_practice(
    session: AsyncSession,
    user_id: str,
    *,
    prompt: str = "",
    answer: str = "",
    srs_enabled: bool = False,
    inherit_fsrs: bool = False,
    inherit_fsrs_from: FsrsState | None = None,
    inboxed: bool = False,
    archived: bool = False,
) -> Practice:
    """Create a new practice."""
    new_practice = Practice(
        user_id=user_id,
        prompt=prompt,
        answer=answer,
        inboxed=inboxed,
        archived=archived,
    )

    # Create FsrsState if srs_enabled or inherit_fsrs
    if srs_enabled or inherit_fsrs:
        fsrs_state = FsrsState(srs_enabled=srs_enabled)
        if inherit_fsrs and inherit_fsrs_from is not None:
            apply_inherited_fsrs(fsrs_state, inherit_fsrs_from)
        session.add(fsrs_state)
        await session.flush()
        new_practice.fsrs_state_id = fsrs_state.id

    session.add(new_practice)
    await session.flush()
    await session.refresh(new_practice)

    return new_practice


async def update_practice(
    session: AsyncSession,
    practice_id: int,
    user_id: str,
    *,
    prompt: str | None = None,
    answer: str | None = None,
    srs_enabled: bool | None = None,
    inboxed: bool | None = None,
    archived: bool | None = None,
) -> Practice:
    """Update a practice using PATCH semantics."""
    practice = await get_practice(session, practice_id, user_id)

    # Handle srs_enabled toggle
    if srs_enabled is not None:
        if srs_enabled and practice.fsrs_state_id is None:
            # Create fsrs_state
            fsrs_state = FsrsState(srs_enabled=True)
            session.add(fsrs_state)
            await session.flush()
            practice.fsrs_state_id = fsrs_state.id
        elif not srs_enabled and practice.fsrs_state:
            practice.fsrs_state.srs_enabled = False

    # Apply remaining updates
    if prompt is not None:
        practice.prompt = prompt
    if answer is not None:
        practice.answer = answer
    if inboxed is not None:
        practice.inboxed = inboxed
    if archived is not None:
        practice.archived = archived

    await session.commit()
    return await load_practice_with_relationships(session, practice_id, user_id)


async def delete_practice(
    session: AsyncSession,
    practice_id: int,
    user_id: str,
) -> None:
    """Delete a practice."""
    practice = await get_practice(session, practice_id, user_id)
    await session.delete(practice)
    await session.commit()


async def get_practice_topics(
    session: AsyncSession, practice_id: int, user_id: str
) -> list[Topic]:
    """Get all topics that this practice assesses."""
    # Verify practice exists and belongs to user
    await get_practice(session, practice_id, user_id)

    # Query topics via junction table
    stmt = (
        select(Topic)
        .join(t_practice_topics, Topic.id == t_practice_topics.c.topic_id)
        .where(t_practice_topics.c.practice_id == practice_id, Topic.user_id == user_id)
        .options(selectinload(Topic.fsrs_state))
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def add_practice_topic(
    session: AsyncSession,
    practice_id: int,
    user_id: str,
    *,
    topic_id: int | None = None,
    topic_data: dict | None = None,
) -> tuple[Practice, Topic]:
    """Add a topic that this practice assesses. Returns (practice, topic)."""
    practice = await get_practice(session, practice_id, user_id)

    if topic_id is None:
        from app.topics.service import create_topic

        inherit_fsrs = bool(topic_data and topic_data.pop("inherit_fsrs", False))
        topic = await create_topic(
            session,
            user_id,
            inherit_fsrs=inherit_fsrs,
            inherit_fsrs_from=practice.fsrs_state if inherit_fsrs else None,
            **(topic_data or {}),
        )
        topic_id = topic.id
    else:
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
    stmt = insert(t_practice_topics).values(
        practice_id=practice_id,
        topic_id=topic_id,
        inserted_at=datetime.now(dt_timezone.utc),
        updated_at=datetime.now(dt_timezone.utc),
    )
    try:
        await session.execute(stmt)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AlreadyExistsError("Practice already assesses this topic")

    # Refresh practice to get updated counts
    await session.refresh(practice)

    return practice, topic


async def remove_practice_topic(
    session: AsyncSession, practice_id: int, topic_id: int, user_id: str
) -> None:
    """Remove a topic that this practice assesses."""
    # Verify practice belongs to user
    await get_practice(session, practice_id, user_id)

    stmt = delete(t_practice_topics).where(
        t_practice_topics.c.practice_id == practice_id,
        t_practice_topics.c.topic_id == topic_id,
    )
    result = await session.execute(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise NotFoundError("Practice-topic relationship")


async def get_practice_sources(
    session: AsyncSession, practice_id: int, user_id: str
) -> list[Source]:
    """Get all sources that this practice assesses."""
    # Verify practice exists and belongs to user
    await get_practice(session, practice_id, user_id)

    # Query sources via junction table
    stmt = (
        select(Source)
        .join(t_practice_sources, Source.id == t_practice_sources.c.source_id)
        .where(
            t_practice_sources.c.practice_id == practice_id, Source.user_id == user_id
        )
        .options(selectinload(Source.fsrs_state))
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def add_practice_source(
    session: AsyncSession,
    practice_id: int,
    user_id: str,
    *,
    source_id: int | None = None,
    source_data: dict | None = None,
) -> tuple[Practice, Source]:
    """Add a source that this practice assesses. Returns (practice, source)."""
    practice = await get_practice(session, practice_id, user_id)

    if source_id is None:
        from app.sources.service import create_source

        inherit_fsrs = bool(source_data and source_data.pop("inherit_fsrs", False))
        source = await create_source(
            session,
            user_id,
            inherit_fsrs=inherit_fsrs,
            inherit_fsrs_from=practice.fsrs_state if inherit_fsrs else None,
            **(source_data or {}),
        )
        source_id = source.id
    else:
        # Verify source exists and belongs to user
        source_result = await session.execute(
            select(Source)
            .where(Source.id == source_id, Source.user_id == user_id)
            .options(selectinload(Source.fsrs_state))
        )
        source = source_result.scalar_one_or_none()
        if not source:
            raise NotFoundError("Source", source_id)

    # Insert relationship
    stmt = insert(t_practice_sources).values(
        practice_id=practice_id,
        source_id=source_id,
        inserted_at=datetime.now(dt_timezone.utc),
        updated_at=datetime.now(dt_timezone.utc),
    )
    try:
        await session.execute(stmt)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AlreadyExistsError("Practice already assesses this source")

    # Refresh practice to get updated counts
    await session.refresh(practice)

    return practice, source


async def remove_practice_source(
    session: AsyncSession, practice_id: int, source_id: int, user_id: str
) -> None:
    """Remove a source that this practice assesses."""
    # Verify practice belongs to user
    await get_practice(session, practice_id, user_id)

    stmt = delete(t_practice_sources).where(
        t_practice_sources.c.practice_id == practice_id,
        t_practice_sources.c.source_id == source_id,
    )
    result = await session.execute(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise NotFoundError("Practice-source relationship")


# ===== Practice Conversions =====


async def convert_practice_to_topic(
    session: AsyncSession, practice_id: int, user_id: str
) -> int:
    """Convert a practice to a topic.

    Returns the new topic ID.

    Transformation:
    - Practice prompt -> Topic name
    - Practice answer -> Topic notes
    - Practice FSRS state -> New Topic FSRS state (core 6 fields)
    - Practice flags -> Topic flags
    - practice_sources -> source_topics (sources now cover new topic)
    - practice_topics -> entity_relations (new topic related to each)
    - Reviews migrated

    No blocking conditions.
    """
    # 1. Load practice with relationships
    practice = await load_practice_with_relationships(session, practice_id, user_id)

    # 2. Create new FSRS state if needed
    new_fsrs_state_id = None
    if practice.fsrs_state:
        new_fsrs = FsrsState(
            srs_enabled=practice.fsrs_state.srs_enabled,
            stability=practice.fsrs_state.stability,
            difficulty=practice.fsrs_state.difficulty,
            state=practice.fsrs_state.state,
            step=practice.fsrs_state.step,
            last_reviewed_at=practice.fsrs_state.last_reviewed_at,
        )
        session.add(new_fsrs)
        await session.flush()
        new_fsrs_state_id = new_fsrs.id

    # 3. Create topic
    new_topic = Topic(
        user_id=user_id,
        name=practice.prompt,
        notes=practice.answer,
        fsrs_state_id=new_fsrs_state_id,
        archived=practice.archived,
        inboxed=practice.inboxed,
    )
    session.add(new_topic)
    await session.flush()

    # 4. Migrate reviews
    await session.execute(
        update(Review)
        .where(Review.practice_id == practice_id)
        .values(topic_id=new_topic.id, practice_id=None)
    )

    # 5. Migrate practice_sources -> source_topics (sources now cover new topic)
    ps_result = await session.execute(
        select(t_practice_sources.c.source_id).where(
            t_practice_sources.c.practice_id == practice_id
        )
    )
    for row in ps_result:
        await session.execute(
            t_source_topics.insert().values(
                source_id=row[0],
                topic_id=new_topic.id,
            )
        )

    # 6. Migrate practice_topics -> entity_relations (new topic related to each)
    pt_result = await session.execute(
        select(t_practice_topics.c.topic_id).where(
            t_practice_topics.c.practice_id == practice_id
        )
    )
    for row in pt_result:
        await EntityRelation.insert_or_ignore(
            session,
            from_topic_id=new_topic.id,
            to_topic_id=row[0],
        )

    # 7. Delete original practice
    await session.delete(practice)

    await session.commit()

    return new_topic.id


async def convert_practice_to_source(
    session: AsyncSession, practice_id: int, user_id: str
) -> int:
    """Convert a practice to a source.

    Returns the new source ID.

    Transformation:
    - Practice prompt -> Source title
    - Practice answer -> Source notes
    - Practice FSRS state -> New Source FSRS state (core 6 fields)
    - Practice flags -> Source flags
    - practice_topics -> source_topics (new source covers those topics)
    - practice_sources -> entity_relations (new source related to each linked source)
    - Reviews migrated

    No blocking conditions.
    """
    # 1. Load practice with relationships
    practice = await load_practice_with_relationships(session, practice_id, user_id)

    # 2. Create new FSRS state if needed
    new_fsrs_state_id = None
    if practice.fsrs_state:
        new_fsrs = FsrsState(
            srs_enabled=practice.fsrs_state.srs_enabled,
            stability=practice.fsrs_state.stability,
            difficulty=practice.fsrs_state.difficulty,
            state=practice.fsrs_state.state,
            step=practice.fsrs_state.step,
            last_reviewed_at=practice.fsrs_state.last_reviewed_at,
        )
        session.add(new_fsrs)
        await session.flush()
        new_fsrs_state_id = new_fsrs.id

    # 3. Create source
    new_source = Source(
        user_id=user_id,
        title=practice.prompt,
        notes=practice.answer,
        fsrs_state_id=new_fsrs_state_id,
        archived=practice.archived,
        inboxed=practice.inboxed,
    )
    session.add(new_source)
    await session.flush()

    # 4. Migrate reviews
    await session.execute(
        update(Review)
        .where(Review.practice_id == practice_id)
        .values(source_id=new_source.id, practice_id=None)
    )

    # 5. Migrate practice_topics -> source_topics (new source covers those topics)
    pt_result = await session.execute(
        select(t_practice_topics.c.topic_id).where(
            t_practice_topics.c.practice_id == practice_id
        )
    )
    for row in pt_result:
        await session.execute(
            t_source_topics.insert().values(
                source_id=new_source.id,
                topic_id=row[0],
            )
        )

    # 6. Migrate practice_sources -> entity_relations (new source related to each)
    ps_result = await session.execute(
        select(t_practice_sources.c.source_id).where(
            t_practice_sources.c.practice_id == practice_id
        )
    )
    for row in ps_result:
        await EntityRelation.insert_or_ignore(
            session,
            from_source_id=new_source.id,
            to_source_id=row[0],
        )

    # 7. Delete original practice
    await session.delete(practice)

    await session.commit()

    return new_source.id
