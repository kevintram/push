from fastapi import APIRouter

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import SessionDep, UserIdDep
from app.models import Topic, t_topics_closure
from app.schemas import TopicRead, TopicCreate

router = APIRouter()


@router.get("/topics/", tags=["topics"])
async def read_topics(
    session: SessionDep,
    user_id: UserIdDep,
    root: bool = False,
) -> list[TopicRead]:

    topics_closure = await session.execute(select(t_topics_closure))
    print(topics_closure.scalars().all())

    stmt = (
        select(Topic)
        .where(Topic.user_id == user_id)
        .options(selectinload(Topic.todos))
    )
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