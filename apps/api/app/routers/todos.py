from fastapi import APIRouter, HTTPException
from app.dependencies import UserIdDep, SessionDep
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from app.models import Todos, Topics
from app.schemas import TodoCreate, TodoRead, TodoUpdate

router = APIRouter()


@router.get("/todos/", tags=["todos"])
async def read_todos(
    session: SessionDep,
    user_id: UserIdDep,
) -> list[TodoRead]:
    stmt = (
        select(Todos)
        .where(Todos.user_id == user_id)
        .order_by(Todos.completed_at.asc().nulls_first(), Todos.scheduled_at.asc())
        .options(selectinload(Todos.topics))
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/todos/", tags=["todos"])
async def create_todo(
    todo: TodoCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TodoRead:
    new_todo = Todos(
        description=todo.description,
        scheduled_at=todo.scheduled_at,
        completed_at=todo.completed_at,
        user_id=user_id,
    )
    session.add(new_todo)
    await session.flush()

    # Associate topics if provided
    if todo.topics:
        topic_ids = [topic.id for topic in todo.topics]
        topic_stmt = select(Topics).where(
            Topics.id.in_(topic_ids), Topics.user_id == user_id
        )
        result = await session.execute(topic_stmt)
        topics = result.scalars().all()
        new_todo.topics = list(topics)

    # Eagerly load the topics relationship before returning
    await session.refresh(new_todo, ["topics"])
    return new_todo


@router.post("/todos/{todo_id}", tags=["todos"])
async def update_todo(
    todo_id: int,
    todo: TodoUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TodoRead:
    # Prepare update values
    update_values = todo.model_dump(
        exclude_unset=True, exclude={"id", "user_id", "topics"}
    )

    # Only perform update if there are fields to update
    if update_values:
        update_stmt = (
            update(Todos)
            .where(Todos.id == todo_id, Todos.user_id == user_id)
            .values(update_values)
        )
        result = await session.execute(update_stmt)

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Todo not found")

    # Handle topics if provided
    if todo.topics is not None:
        # Fetch the todo with topics eagerly loaded to update its topics
        todo_stmt = (
            select(Todos)
            .where(Todos.id == todo_id, Todos.user_id == user_id)
            .options(selectinload(Todos.topics))
        )
        todo_result = await session.execute(todo_stmt)
        updated_todo = todo_result.scalar_one_or_none()

        if not updated_todo:
            raise HTTPException(status_code=404, detail="Todo not found")

        topic_ids = [topic.id for topic in todo.topics]
        topic_stmt = select(Topics).where(
            Topics.id.in_(topic_ids), Topics.user_id == user_id
        )
        topic_result = await session.execute(topic_stmt)
        topics = topic_result.scalars().all()
        updated_todo.topics = list(topics)

    # Re-fetch with topics eagerly loaded
    stmt = (
        select(Todos)
        .where(Todos.id == todo_id, Todos.user_id == user_id)
        .options(selectinload(Todos.topics))
    )
    final_result = await session.execute(stmt)
    return final_result.scalar_one()


@router.delete("/todos/{todo_id}", tags=["todos"])
async def delete_todo(todo_id: int, session: SessionDep, user_id: UserIdDep):
    stmt = delete(Todos).where(Todos.id == todo_id).returning(Todos)
    result = await session.execute(stmt)
    deleted_todo = result.scalar_one_or_none()

    if not deleted_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
