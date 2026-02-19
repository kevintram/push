"""Auth dependencies."""

import logging
from urllib.parse import urlparse
from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response, status

from app.config import get_settings
from app.auth.workos import get_workos

logger = logging.getLogger(__name__)


def _cookie_domain(domain: str) -> str:
    """Return cookie-safe domain host (strip scheme if present)."""
    return (urlparse(domain).hostname or domain).lstrip(".")


async def get_user_id(
    request: Request,
    response: Response,
) -> str:
    """Get user ID from session token or raise HTTPException."""
    settings = get_settings()
    workos = get_workos()
    session_cookie = request.cookies.get(settings.WORKOS_COOKIE_NAME)

    session = workos.user_management.load_sealed_session(
        sealed_session=session_cookie, cookie_password=settings.WORKOS_COOKIE_PASSWORD
    )
    auth_response = session.authenticate()
    secure = settings.ENV == "prod"
    domain = _cookie_domain(settings.DOMAIN) if secure else None

    if auth_response.authenticated:
        response.set_cookie(
            "logged_in",
            value="1",
            secure=secure,
            httponly=False,
            domain=domain,
            samesite="lax",
        )
        return auth_response.user.id
    elif auth_response.reason == "no_session_cookie_provided":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session cookie provided",
        )
    else:
        try:
            logger.debug("Refreshing session")
            result = session.refresh()
            if result.authenticated is False:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed",
                )

            response.set_cookie(
                settings.WORKOS_COOKIE_NAME,
                value=result.sealed_session,
                secure=secure,
                httponly=True,
                domain=domain,
                samesite="lax",
            )
            response.set_cookie(
                "logged_in",
                value="1",
                secure=secure,
                httponly=False,
                domain=domain,
                samesite="lax",
            )
            return result.user.id
        except HTTPException:
            raise
        except Exception as e:
            logger.warning("Error refreshing session: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed"
            )


UserIdDep = Annotated[str, Depends(get_user_id)]
