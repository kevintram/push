"""Topics HTTP endpoints."""

from typing import Literal

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.schemas.topics import TopicCreate, TopicRead, TopicUpdate
from app.topics import service

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/")
async def read_topics(
    session: SessionDep,
    user_id: UserIdDep,
    root: bool | None = None,
    parent_id: int | None = None,
    sort: Literal["updated_at", "title"] = "updated_at",
    order: Literal["asc", "desc"] = "desc",
) -> list[TopicRead]:
    return await service.list_topics(
        session,
        user_id,
        root=root,
        parent_id=parent_id,
        sort=sort,
        order=order,
    )


@router.get("/{topic_id}/")
async def read_topic(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int,
) -> TopicRead:
    return await service.get_topic(session, topic_id, user_id)


@router.post("/", status_code=201)
async def insert_topic(
    payload: TopicCreate, session: SessionDep, user_id: UserIdDep
) -> TopicRead:
    return await service.create_topic(session, user_id, **payload.model_dump())


@router.patch("/{topic_id}/")
async def update_topic(
    topic_id: int,
    payload: TopicUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicRead:
    updates = payload.model_dump(exclude_unset=True)
    return await service.update_topic(session, topic_id, user_id, updates=updates)


@router.delete("/{topic_id}/", status_code=204)
async def delete_topic(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    await service.delete_topic(session, topic_id, user_id)
