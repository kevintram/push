from fastapi import APIRouter
from app.dependencies import UserIdDep, SessionDep
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models import TodosWithTopicsPublic, TodosTable

router = APIRouter()


@router.get("/todos/", tags=["todos"])
async def read_todos(
    session: SessionDep,
    user_id: UserIdDep,
) -> list[TodosWithTopicsPublic]:
    stmt = select(TodosTable).where(
        TodosTable.user_id == user_id
    ).order_by(
        TodosTable.completed_at.asc().nulls_first(),
        TodosTable.scheduled_at.asc()
    ).options(
        selectinload(TodosTable.topics)
    )
    result = await session.execute(stmt)
    return result.scalars().all()
