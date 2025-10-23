from typing import Annotated

from fastapi import Cookie, Header, HTTPException, status, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.auth import workos
from app.core.db import engine
from typing import AsyncGenerator

async def get_token_header(x_token: Annotated[str, Header()]):
    if x_token != "fake-super-secret-token":
        raise HTTPException(status_code=400, detail="X-Token header invalid")

async def get_user_id(
    request: Request,
    session_cookie: Annotated[
        str | None, Cookie(alias=settings.WORKOS_COOKIE_NAME)
    ] = None,
) -> str:
    print(request.cookies.__str__())
    
    session = workos.user_management.load_sealed_session(
        sealed_session=session_cookie, cookie_password=settings.WORKOS_COOKIE_PASSWORD
    )
    auth_response = session.authenticate()

    if not auth_response.authenticated:
        print("not authenticated:")
        print(auth_response)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    return auth_response.user.id
UserIdDep = Annotated[str, Depends(get_user_id)]


async def get_db_session() -> AsyncGenerator:
    async with AsyncSession(engine) as session:
        # Optional: BEGIN a transaction; many apps prefer explicit begin
        async with session.begin():
            yield session
SessionDep = Annotated[AsyncSession, Depends(get_db_session)]
