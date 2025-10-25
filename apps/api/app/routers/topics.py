from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.dependencies import SessionDep, UserIdDep
from app.models import TopicsWithTodosPublic, TopicsTable

router = APIRouter()


@router.get("/topics/", tags=["topics"])
async def read_topics(
    session: SessionDep,    
    user_id: UserIdDep,
) -> list[TopicsWithTodosPublic]:
    stmt = select(TopicsTable).where(TopicsTable.user_id == user_id).options(selectinload(TopicsTable.todos))
    result = await session.execute(stmt)
    return result.scalars().all()
