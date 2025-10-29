from fastapi import APIRouter, HTTPException

from sqlalchemy import or_, select, update
from sqlalchemy.orm import selectinload

from app.dependencies import SessionDep, UserIdDep
from app.models import Topic, t_topics_closure
from app.schemas import TopicRead, TopicCreate, TopicUpdate, TopicReadWithRelationships

router = APIRouter()


@router.get("/topics/search/", tags=["topics"])
async def search_topics(
    session: SessionDep,
    user_id: UserIdDep,
    query: str | None = None,
    limit: int = 10,
) -> list[TopicRead]:
    cleaned_query = query.strip() if query else ""
    stmt = select(Topic).where(Topic.user_id == user_id)

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

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/topics/", tags=["topics"])
async def read_topics(
    session: SessionDep,
    user_id: UserIdDep,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
) -> list[TopicReadWithRelationships]:
    stmt = select(Topic).where(Topic.user_id == user_id).order_by(Topic.updated_at)
    if inboxed is not None:
        stmt = stmt.where(Topic.inboxed == inboxed)
    if archived is not None:
        stmt = stmt.where(Topic.archived == archived)

    if root is not None and root is True:
        topics_with_ancestors = select(t_topics_closure.c.descendant).where(t_topics_closure.c.depth > 0)
        stmt = stmt.where(Topic.id.notin_(topics_with_ancestors))

    stmt = stmt.options(selectinload(Topic.parents), selectinload(Topic.children))

    result = await session.execute(stmt)
    return result.scalars().all()

@router.get("/topics/{topic_id}/", tags=["topics"])
async def read_topic(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int
) -> TopicReadWithRelationships:
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    stmt = stmt.options(selectinload(Topic.parents), selectinload(Topic.children))

    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/topics/", tags=["topics"])
async def insert_topic(
    topic: TopicCreate,
    session: SessionDep,
    user_id: UserIdDep
) -> TopicRead:
    new_topic = Topic(**topic.model_dump(), user_id=user_id)

    session.add(new_topic)
    await session.flush()
    await session.refresh(new_topic, ["todos"])

    return new_topic


@router.post("/topics/{topic_id}/", tags=["topics"])
async def update_topic(
    topic_id: int,
    topic: TopicUpdate,
    session: SessionDep,
    user_id: UserIdDep
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
