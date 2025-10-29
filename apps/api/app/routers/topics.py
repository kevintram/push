from fastapi import APIRouter, HTTPException

from sqlalchemy import or_, select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import SessionDep, UserIdDep
from app.models import Topic, t_topics_closure, Todo, t_todos_topics
from app.schemas import (
    TopicRead,
    TopicCreate,
    TopicUpdate,
    TopicReadWithRelationships,
    TopicReadWithRelationshipsAndTodos,
    TopicRelationshipCreate,
    TopicParentRelationshipCreate,
    TopicReadWithTodos,
    TodoIdPayload,
)

router = APIRouter()


async def _insert_topic_relationship(
    session: AsyncSession,
    *,
    user_id: str,
    parent_id: int,
    child_id: int,
    focus_topic_id: int,
) -> Topic:
    if parent_id == child_id:
        raise HTTPException(status_code=400, detail="Parent and child must be different topics")

    topics_result = await session.execute(
        select(Topic.id).where(
            Topic.user_id == user_id,
            Topic.id.in_([parent_id, child_id]),
        )
    )
    topic_ids = set(topics_result.scalars())

    if parent_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Parent topic not found")
    if child_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Child topic not found")

    conn = await session.connection()

    def _call_insert_relationship(sync_conn):
        with sync_conn.cursor() as cursor:
            cursor.callproc("insert_relationship", [parent_id, child_id])
            return cursor.fetchall()

    inserted_rows = await conn.run_sync(_call_insert_relationship)

    if not inserted_rows:
        raise HTTPException(
            status_code=400,
            detail="Relationship already exists or would create a cycle",
        )

    refreshed_topic = await session.execute(
        select(Topic)
        .where(Topic.id == focus_topic_id, Topic.user_id == user_id)
        .options(
            selectinload(Topic.parents),
            selectinload(Topic.children),
            selectinload(Topic.todos),
        )
    )
    topic = refreshed_topic.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic


async def _delete_topic_relationship(
    session: AsyncSession,
    *,
    user_id: str,
    parent_id: int,
    child_id: int,
    focus_topic_id: int,
) -> Topic:
    if parent_id == child_id:
        raise HTTPException(status_code=400, detail="Parent and child must be different topics")

    topics_result = await session.execute(
        select(Topic.id).where(
            Topic.user_id == user_id,
            Topic.id.in_([parent_id, child_id]),
        )
    )
    topic_ids = set(topics_result.scalars())

    if parent_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Parent topic not found")
    if child_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Child topic not found")

    relationship_result = await session.execute(
        select(t_topics_closure.c.ancestor).where(
            t_topics_closure.c.ancestor == parent_id,
            t_topics_closure.c.descendant == child_id,
            t_topics_closure.c.depth == 1,
        )
    )
    relationship_exists = relationship_result.scalar_one_or_none()

    if relationship_exists is None:
        raise HTTPException(status_code=404, detail="Relationship not found")

    conn = await session.connection()

    def _call_delete_relationship(sync_conn):
        with sync_conn.cursor() as cursor:
            cursor.callproc("delete_relationship", [parent_id, child_id])

    await conn.run_sync(_call_delete_relationship)

    refreshed_topic = await session.execute(
        select(Topic)
        .where(Topic.id == focus_topic_id, Topic.user_id == user_id)
        .options(
            selectinload(Topic.parents),
            selectinload(Topic.children),
            selectinload(Topic.todos),
        )
    )
    topic = refreshed_topic.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic


@router.get("/topics/search/", tags=["topics"])
async def search_topics(
    session: SessionDep,
    user_id: UserIdDep,
    addable_as_parent_to: int | None = None,
    addable_as_child_to: int | None = None,
    addable_to_todo: int | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[TopicRead]:
    cleaned_query = query.strip() if query else ""
    stmt = select(Topic).where(Topic.user_id == user_id)

    if addable_as_parent_to is not None:
        # filter out all topics that can't be parents to addable_as_parent_to   

        # 1. filter out addable_as_parent_to's descendants (if add a descendant as parent, it will create a cycle)
        descendants = select(t_topics_closure.c.descendant).where(t_topics_closure.c.ancestor == addable_as_parent_to)
        stmt = stmt.where(Topic.id.notin_(descendants))

        # 2. filter out addable_as_parent_to's parents (don't want to add a topic that's already a parent)
        parents = select(t_topics_closure.c.ancestor).where(t_topics_closure.c.descendant == addable_as_parent_to, t_topics_closure.c.depth == 1)
        stmt = stmt.where(Topic.id.notin_(parents))
    if addable_as_child_to is not None:
        # filter out all topics that can't be children to addable_as_child_to

        # 1. filter out addable_as_child_to's ancestors (if add an ancestor as child, it will create a cycle)
        ancestors = select(t_topics_closure.c.ancestor).where(t_topics_closure.c.descendant == addable_as_child_to)
        stmt = stmt.where(Topic.id.notin_(ancestors))

        # 2. filter out addable_as_child_to's children (don't want to add a topic that's already a child)
        children = select(t_topics_closure.c.descendant).where(t_topics_closure.c.ancestor == addable_as_child_to, t_topics_closure.c.depth == 1)
        stmt = stmt.where(Topic.id.notin_(children))
    if addable_to_todo is not None:
        # filter out all topics that can't be added to addable_to_todo
        # filter out addable_to_todo's topics (don't want to add a topic that's already a topic)
        topics = select(t_todos_topics.c.topic_id).where(t_todos_topics.c.todo_id == addable_to_todo)
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

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/topics/", tags=["topics"])
async def read_topics(
    session: SessionDep,
    user_id: UserIdDep,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
) -> list[TopicReadWithRelationshipsAndTodos]:
    stmt = select(Topic).where(Topic.user_id == user_id).order_by(Topic.updated_at)
    if inboxed is not None:
        stmt = stmt.where(Topic.inboxed == inboxed)
    if archived is not None:
        stmt = stmt.where(Topic.archived == archived)

    if root is not None and root is True:
        topics_with_ancestors = select(t_topics_closure.c.descendant).where(t_topics_closure.c.depth > 0)
        stmt = stmt.where(Topic.id.notin_(topics_with_ancestors))

    stmt = stmt.options(selectinload(Topic.parents), selectinload(Topic.children), selectinload(Topic.todos))

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/topics/{topic_id}/", tags=["topics"])
async def read_topic(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int
) -> TopicReadWithRelationshipsAndTodos:
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    stmt = stmt.options(selectinload(Topic.parents), selectinload(Topic.children), selectinload(Topic.todos))

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

@router.post("/topics/{parent_id}/children/", tags=["topics"])
async def insert_child(
    parent_id: int,
    payload: TopicRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep
) -> TopicReadWithRelationshipsAndTodos:
    child_id = payload.child_id
    return await _insert_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=parent_id,
    )


@router.post("/topics/{child_id}/parents/", tags=["topics"])
async def insert_parent(
    child_id: int,
    payload: TopicParentRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReadWithRelationshipsAndTodos:
    parent_id = payload.parent_id
    return await _insert_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=child_id,
    )


@router.delete("/topics/{parent_id}/children/{child_id}/", tags=["topics"])
async def delete_child(
    parent_id: int,
    child_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReadWithRelationshipsAndTodos:
    return await _delete_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=parent_id,
    )


@router.delete("/topics/{child_id}/parents/{parent_id}/", tags=["topics"])
async def delete_parent(
    child_id: int,
    parent_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReadWithRelationshipsAndTodos:
    return await _delete_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=child_id,
    )

@router.post("/topics/{topic_id}/todos/", tags=["topics"])
async def add_todo(
    topic_id: int,
    payload: TodoIdPayload,
    session: SessionDep,
    user_id: UserIdDep
) -> TopicReadWithTodos:
    todo_id = payload.todo_id

    todo_result = await session.execute(
        select(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .options(selectinload(Todo.topics))
    )
    todo = todo_result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    topic_result = await session.execute(
        select(Topic)
        .where(Topic.id == topic_id, Topic.user_id == user_id)
        .options(selectinload(Topic.todos))
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    existing_link = await session.execute(
        select(t_todos_topics.c.todo_id).where(
            t_todos_topics.c.todo_id == todo_id,
            t_todos_topics.c.topic_id == topic_id,
        )
    )
    if existing_link.first():
        raise HTTPException(status_code=409, detail="Todo already linked to topic")

    todo.topics.append(topic)
    await session.flush()
    await session.refresh(topic, ["todos"])
    return topic


@router.delete("/topics/{topic_id}/todos/{todo_id}/", tags=["topics"])
async def remove_todo(
    topic_id: int,
    todo_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReadWithTodos:
    todo_result = await session.execute(
        select(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .options(selectinload(Todo.topics))
    )
    todo = todo_result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    topic_result = await session.execute(
        select(Topic)
        .where(Topic.id == topic_id, Topic.user_id == user_id)
        .options(selectinload(Topic.todos))
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    relationship_result = await session.execute(
        select(t_todos_topics.c.todo_id).where(
            t_todos_topics.c.todo_id == todo_id,
            t_todos_topics.c.topic_id == topic_id,
        )
    )
    if relationship_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Todo not linked to topic")

    await session.execute(
        delete(t_todos_topics).where(
            t_todos_topics.c.todo_id == todo_id,
            t_todos_topics.c.topic_id == topic_id,
        )
    )
    await session.flush()
    await session.refresh(topic, ["todos"])
    return topic



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

@router.delete("/topics/{topic_id}/", tags=["topics"])
async def delete_topic(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep
):
    stmt = delete(Topic).where(Topic.id == topic_id).returning(Topic)
    result = await session.execute(stmt)
    deleted_topic = result.scalar_one_or_none()

    if not deleted_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
