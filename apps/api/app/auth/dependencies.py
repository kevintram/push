"""Auth dependencies."""

from typing import Annotated

from fastapi import Depends, Request, Response

from app.auth.session import authenticate_session, set_session_cookie
from app.config import get_settings
from app.exceptions import AuthenticationError


async def get_user_id(
    request: Request,
    response: Response,
) -> str:
    """Get user ID from the session cookie or raise AuthenticationError."""
    settings = get_settings()
    result = authenticate_session(request.cookies.get(settings.WORKOS_COOKIE_NAME))

    if not result.authenticated or result.user_id is None:
        raise AuthenticationError(
            result.failure_reason or "Authentication failed",
            clear_auth_cookies=True,
        )

    if result.sealed_session is not None:
        set_session_cookie(response, result.sealed_session)

    return result.user_id


UserIdDep = Annotated[str, Depends(get_user_id)]
