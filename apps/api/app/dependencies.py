from typing import Annotated

from fastapi import Cookie, Header, HTTPException, status
from app.core.config import settings
from app.core.auth import workos


async def get_token_header(x_token: Annotated[str, Header()]):
    if x_token != "fake-super-secret-token":
        raise HTTPException(status_code=400, detail="X-Token header invalid")


async def get_user_id(
    session_cookie: Annotated[
        str | None, Cookie(alias=settings.WORKOS_COOKIE_NAME)
    ] = None,
) -> str:
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
