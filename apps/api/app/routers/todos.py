from fastapi import APIRouter
from app.dependencies import UserIdDep, SessionDep
from sqlalchemy import select, insert
from sqlalchemy.orm import selectinload
from app.models import (
    TodosCreate,
    TodosRead,
    TodosTable,
    TopicsTable,
)

router = APIRouter()


@router.get("/todos/", tags=["todos"])
async def read_todos(
    session: SessionDep,
    user_id: UserIdDep,
) -> list[TodosRead]:
    stmt = (
        select(TodosTable)
        .where(TodosTable.user_id == user_id)
        .order_by(
            TodosTable.completed_at.asc().nulls_first(), TodosTable.scheduled_at.asc()
        )
        .options(selectinload(TodosTable.topics))
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/todos/", tags=["todos"])
async def create_todo(
    todo: TodosCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TodosRead:
    new_todo = TodosTable(
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
        topic_stmt = select(TopicsTable).where(
            TopicsTable.id.in_(topic_ids), TopicsTable.user_id == user_id
        )
        result = await session.execute(topic_stmt)
        topics = result.scalars().all()
        new_todo.topics = list(topics)

    await session.refresh(new_todo, ["topics"])
    return new_todo