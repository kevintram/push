"""Practice business logic and data access."""

from datetime import datetime, timezone as dt_timezone
from typing import Literal

from sqlalchemy import delete, desc, insert, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import AlreadyExistsError, NotFoundError
from app.models import (
    EntityRelation,
    FsrsState,
    Practice,
    Review,
    Source,
    Topic,
    t_practice_sources,
    t_practice_topics,
    t_source_topics,
)


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
    inboxed: bool | None = None,
    archived: bool | None = None,
    has_stability: bool | None = None,
    srs_enabled: bool | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[Practice]:
    """List practices with optional filters."""
    stmt = select(Practice).where(Practice.user_id == user_id)

    # Apply ordering
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

    result = await session.execute(stmt)
    return list(result.scalars().unique().all())


async def create_practice(
    session: AsyncSession,
    user_id: str,
    *,
    prompt: str = "",
    answer: str = "",
    srs_enabled: bool = False,
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

    # Create FsrsState if srs_enabled
    if srs_enabled:
        fsrs_state = FsrsState(srs_enabled=True)
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
    session: AsyncSession, practice_id: int, topic_id: int, user_id: str
) -> tuple[Practice, Topic]:
    """Add a topic that this practice assesses. Returns (practice, topic)."""
    practice = await get_practice(session, practice_id, user_id)

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
    session: AsyncSession, practice_id: int, source_id: int, user_id: str
) -> tuple[Practice, Source]:
    """Add a source that this practice assesses. Returns (practice, source)."""
    practice = await get_practice(session, practice_id, user_id)

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
        new_rel = EntityRelation(
            from_topic_id=new_topic.id,
            to_topic_id=row[0],
        )
        session.add(new_rel)

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
        new_rel = EntityRelation(
            from_source_id=new_source.id,
            to_source_id=row[0],
        )
        session.add(new_rel)

    # 7. Delete original practice
    await session.delete(practice)

    await session.commit()

    return new_source.id
