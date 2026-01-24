"""Shared dependencies.

Note: UserIdDep is in app/auth/dependencies.py - import from there.
Note: get_token_header is in app/admin/dependencies.py - import from there.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

SessionDep = Annotated[AsyncSession, Depends(get_db)]
