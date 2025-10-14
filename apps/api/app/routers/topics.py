from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection
from app.core.db import get_db_connection

router = APIRouter()

@router.get("/topics/", tags=["topics"])
async def read_topics(conn: AsyncConnection = Depends(get_db_connection)):
    result = await conn.execute(text("SELECT * FROM topics"))
    rows = result.fetchall()

    print(rows)

    # Convert rows to list of dicts for JSON serialization
    topics = [dict(row._mapping) for row in rows]

    return {"topics": topics}
