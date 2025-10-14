from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from typing import AsyncGenerator
from .config import settings

# Create the async engine
engine: AsyncEngine = create_async_engine(str(settings.POSTGRES_URL), echo=True)


async def get_db_connection() -> AsyncGenerator:
    """Dependency for getting a database connection"""
    async with engine.begin() as conn:
        yield conn
