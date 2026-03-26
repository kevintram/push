"""Topics business logic and data access."""

from typing import Literal

from sqlalchemy import case, desc, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import BadRequestError, NotFoundError
from app.models import Topic


async def get_topic(session: AsyncSession, topic_id: int, user_id: str) -> Topic:
    stmt = (
        select(Topic)
        .where(Topic.id == topic_id, Topic.user_id == user_id)
        .options(selectinload(Topic.parent))
    )
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic", topic_id)
    return topic


async def is_descendant_of(
    session: AsyncSession, potential_descendant_id: int, ancestor_id: int
) -> bool:
    result = await session.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1 FROM topics d, topics a
                WHERE d.id = :descendant_id
                  AND a.id = :ancestor_id
                  AND d.path <@ a.path
            )
            """
        ),
        {"descendant_id": potential_descendant_id, "ancestor_id": ancestor_id},
    )
    return bool(result.scalar())


async def list_topics(
    session: AsyncSession,
    user_id: str,
    *,
    root: bool | None = None,
    parent_id: int | None = None,
    subtree_of: int | None = None,
    sort: Literal["updated_at", "title"] = "updated_at",
    order: str = "desc",
) -> list[Topic]:
    stmt = select(Topic).where(Topic.user_id == user_id)

    if root is True:
        stmt = stmt.where(Topic.parent_id.is_(None))
    if parent_id is not None:
        stmt = stmt.where(Topic.parent_id == parent_id)
    if subtree_of is not None:
        subtree_root = await get_topic(session, subtree_of, user_id)
        stmt = stmt.where(Topic.path.op("<@")(subtree_root.path))

    if sort == "title":
        normalized_title = case(
            (func.length(func.trim(Topic.title)) == 0, "untitled topic"),
            else_=func.lower(func.trim(Topic.title)),
        )
        if order == "asc":
            stmt = stmt.order_by(normalized_title.asc(), Topic.id.asc())
        else:
            stmt = stmt.order_by(normalized_title.desc(), Topic.id.desc())
    elif order == "asc":
        stmt = stmt.order_by(Topic.updated_at.asc(), Topic.id.asc())
    else:
        stmt = stmt.order_by(desc(Topic.updated_at), Topic.id.desc())

    stmt = stmt.options(selectinload(Topic.parent))

    result = await session.execute(stmt)
    return list(result.scalars().unique().all())


async def create_topic(
    session: AsyncSession,
    user_id: str,
    *,
    title: str = "",
    body: str = "",
    parent_id: int | None = None,
) -> Topic:
    if parent_id is not None:
        await get_topic(session, parent_id, user_id)

    topic = Topic(
        user_id=user_id,
        title=title,
        body=body,
        parent_id=parent_id,
    )

    session.add(topic)
    await session.flush()

    return await get_topic(session, topic.id, user_id)


async def update_topic(
    session: AsyncSession,
    topic_id: int,
    user_id: str,
    *,
    updates: dict,
) -> Topic:
    topic = await get_topic(session, topic_id, user_id)

    if "parent_id" in updates:
        parent_id = updates["parent_id"]
        if parent_id is not None:
            if parent_id == topic_id:
                raise BadRequestError("Cannot set topic as its own parent")
            await get_topic(session, parent_id, user_id)
            if await is_descendant_of(session, parent_id, topic_id):
                raise BadRequestError("Cannot set parent: would create a cycle")
        topic.parent_id = parent_id

    if "title" in updates and updates["title"] is not None:
        topic.title = updates["title"]
    if "body" in updates and updates["body"] is not None:
        topic.body = updates["body"]

    await session.flush()
    return await get_topic(session, topic_id, user_id)


async def delete_topic(session: AsyncSession, topic_id: int, user_id: str) -> None:
    topic = await get_topic(session, topic_id, user_id)
    await session.delete(topic)
    await session.flush()
