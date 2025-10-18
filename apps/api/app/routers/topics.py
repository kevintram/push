from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection
from app.core.db import get_db_connection
from app.dependencies import get_user_id

router = APIRouter()


@router.get("/topics/", tags=["topics"])
async def read_topics(
    conn: AsyncConnection = Depends(get_db_connection),
    user_id: bool = Depends(get_user_id),
):
    result = await conn.execute(text("SELECT * FROM topics"))
    rows = result.fetchall()

    # Convert rows to list of dicts for JSON serialization
    topics = [dict(row._mapping) for row in rows]

    return {"topics": topics}
