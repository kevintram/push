"""Shared session authentication helpers."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from urllib.parse import urlparse

from fastapi import Response

from app.auth.workos import get_workos
from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


def cookie_domain(domain: str) -> str:
    """Return cookie-safe domain host (strip scheme if present)."""
    return (urlparse(domain).hostname or domain).lstrip(".")


def cookie_kwargs(settings: Settings) -> dict[str, bool | str | None]:
    secure = settings.ENV == "prod"
    domain = cookie_domain(settings.DOMAIN) if secure else None
    return {
        "secure": secure,
        "domain": domain,
        "samesite": "lax",
    }


def set_session_cookie(response: Response, sealed_session: str) -> None:
    settings = get_settings()
    response.set_cookie(
        settings.WORKOS_COOKIE_NAME,
        value=sealed_session,
        httponly=True,
        **cookie_kwargs(settings),
    )


def clear_auth_cookies(response: Response) -> None:
    settings = get_settings()
    kwargs = cookie_kwargs(settings)
    response.delete_cookie(settings.WORKOS_COOKIE_NAME, **kwargs)
    response.delete_cookie("logged_in", **kwargs)


@dataclass(slots=True)
class SessionAuthenticationResult:
    authenticated: bool
    user_id: str | None = None
    sealed_session: str | None = None
    failure_reason: str | None = None


def authenticate_session(
    session_cookie: str | None,
) -> SessionAuthenticationResult:
    settings = get_settings()
    workos = get_workos()

    session = workos.user_management.load_sealed_session(
        sealed_session=session_cookie,
        cookie_password=settings.WORKOS_COOKIE_PASSWORD,
    )
    auth_response = session.authenticate()

    if auth_response.authenticated:
        return SessionAuthenticationResult(
            authenticated=True,
            user_id=auth_response.user.id,
        )

    if auth_response.reason == "no_session_cookie_provided":
        return SessionAuthenticationResult(
            authenticated=False,
            failure_reason="No session cookie provided",
        )

    try:
        logger.debug("Refreshing session")
        refresh_result = session.refresh()
    except Exception as exc:
        logger.warning("Error refreshing session: %s", exc)
        return SessionAuthenticationResult(
            authenticated=False,
            failure_reason="Authentication failed",
        )

    if refresh_result.authenticated is False:
        return SessionAuthenticationResult(
            authenticated=False,
            failure_reason="Authentication failed",
        )

    return SessionAuthenticationResult(
        authenticated=True,
        user_id=refresh_result.user.id,
        sealed_session=refresh_result.sealed_session,
    )
