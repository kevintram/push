from typing import Annotated

from fastapi import Cookie, Header, HTTPException, status, Request, Depends, Response
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
    response: Response,
    session_cookie: Annotated[
        str | None, Cookie(alias=settings.WORKOS_COOKIE_NAME)
    ] = None,
) -> str:
    print(request.cookies.__str__())

    session = workos.user_management.load_sealed_session(
        sealed_session=session_cookie, cookie_password=settings.WORKOS_COOKIE_PASSWORD
    )
    auth_response = session.authenticate()

    if auth_response.authenticated:
        return auth_response.user.id
    elif auth_response.reason == "no_session_cookie_provided":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session cookie provided"
        )
    else:
        try:
            print("Refreshing session")
            result = session.refresh()
            if result.authenticated is False:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed"
                )

            response.set_cookie(
                settings.WORKOS_COOKIE_NAME,
                value=result.sealed_session,
                secure=True if settings.ENV == "prod" else False,
                httponly=True,
                domain=settings.DOMAIN if settings.ENV == "prod" else None,
                samesite="lax",
            )
            return result.user.id
        except HTTPException:
            raise
        except Exception as e:
            print("Error refreshing session", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )
UserIdDep = Annotated[str, Depends(get_user_id)]


async def get_db_session() -> AsyncGenerator:
    async with AsyncSession(engine) as session:
        # Optional: BEGIN a transaction; many apps prefer explicit begin
        async with session.begin():
            yield session
SessionDep = Annotated[AsyncSession, Depends(get_db_session)]
