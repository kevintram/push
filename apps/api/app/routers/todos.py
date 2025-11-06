from fastapi import APIRouter, HTTPException
from app.dependencies import UserIdDep, SessionDep
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from app.models import Todo, Topic, Review
from app.schemas import TodoCreate, TodoRead, TodoUpdate, TopicIdPayload, TopicRead, TodoReadWithTopics

router = APIRouter()


@router.get("/todos/", tags=["todos"])
async def read_todos(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int | None = None,
) -> list[TodoReadWithTopics]:
    stmt = (
        select(Todo)
        .where(Todo.user_id == user_id)
        .order_by(Todo.completed_at.asc().nulls_first(), Todo.scheduled_at.asc())
        .options(selectinload(Todo.topics))
    )

    if topic_id is not None:
        stmt = stmt.where(Todo.topics.any(Topic.id == topic_id))

    result = await session.execute(stmt)
    ret = result.scalars().all()
    return ret


@router.get("/todos/{todo_id}/", tags=["todos"])
async def read_todo(
    session: SessionDep,
    user_id: UserIdDep,
    todo_id: int
) -> TodoReadWithTopics:
    stmt = select(Todo).where(Todo.id == todo_id, Todo.user_id == user_id)
    stmt = stmt.options(selectinload(Todo.topics))
    result = await session.execute(stmt)

    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    return todo


@router.post("/todos/", tags=["todos"])
async def create_todo(
    todo: TodoCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TodoRead:
    new_todo = Todo(
        description=todo.description,
        scheduled_at=todo.scheduled_at,
        completed_at=todo.completed_at,
        user_id=user_id,
    )
    session.add(new_todo)
    await session.flush()
    await session.refresh(new_todo)
    return new_todo


@router.post("/todos/{todo_id}", tags=["todos"])
async def update_todo(
    todo_id: int,
    todo: TodoUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TodoRead:
    update_values = todo.model_dump(exclude_unset=True, exclude={"id", "user_id"})

    if not update_values:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_stmt = (
        update(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .values(update_values)
    )
    result = await session.execute(update_stmt)

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Todo not found")

    stmt = (
        select(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .options(selectinload(Todo.topics))
    )
    final_result = await session.execute(stmt)
    return final_result.scalar_one()

@router.get("/todos/{todo_id}/topics/", tags=["todos"])
async def read_topics_for_todo(
    todo_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[TopicRead]:
    stmt = select(Topic).where(Topic.todos.any(Todo.id == todo_id), Topic.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalars().all()

@router.post("/todos/{todo_id}/topics/", tags=["todos"])
async def add_topic(
    todo_id: int,
    payload: TopicIdPayload,
    session: SessionDep,
    user_id: UserIdDep,
) -> TodoReadWithTopics:
    topic_id = payload.topic_id

    todo_result = await session.execute(
        select(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .options(selectinload(Todo.topics))
    )
    todo = todo_result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    topic_result = await session.execute(
        select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    existing_link = await session.execute(
        select(Review.todo_id).where(
            Review.todo_id == todo_id,
            Review.topic_id == topic_id,
        )
    )
    if existing_link.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Topic already linked to todo")

    review = Review(todo_id=todo_id, topic_id=topic_id, rating="good")
    session.add(review)
    await session.flush()
    await session.refresh(todo, ["topics"])
    return todo


@router.delete("/todos/{todo_id}/topics/{topic_id}/", tags=["todos"])
async def remove_topic(
    todo_id: int,
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TodoRead:
    todo_result = await session.execute(
        select(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .options(selectinload(Todo.topics))
    )
    todo = todo_result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    topic_result = await session.execute(
        select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    relationship_result = await session.execute(
        select(Review.todo_id).where(
            Review.todo_id == todo_id,
            Review.topic_id == topic_id,
        )
    )
    if relationship_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Topic not linked to todo")

    await session.execute(
        delete(Review).where(
            Review.todo_id == todo_id,
            Review.topic_id == topic_id,
        )
    )
    await session.flush()
    await session.refresh(todo)
    return todo


@router.delete("/todos/{todo_id}", tags=["todos"])
async def delete_todo(todo_id: int, session: SessionDep, user_id: UserIdDep):
    stmt = (
        delete(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .returning(Todo)
    )
    result = await session.execute(stmt)
    deleted_todo = result.scalar_one_or_none()

    if not deleted_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
