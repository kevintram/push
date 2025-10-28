from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.dependencies import SessionDep, UserIdDep
from app.models import Topics
from app.schemas import TopicsWithTodosPublic

router = APIRouter()


@router.get("/topics/", tags=["topics"])
async def read_topics(
    session: SessionDep,
    user_id: UserIdDep,
) -> list[TopicsWithTodosPublic]:
    stmt = (
        select(Topics)
        .where(Topics.user_id == user_id)
        .options(selectinload(Topics.todos))
    )
    result = await session.execute(stmt)
    return result.scalars().all()
