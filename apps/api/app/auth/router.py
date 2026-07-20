"""Auth HTTP endpoints - login, callback, logout."""

from urllib.parse import urlencode

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from starlette import status

from app.auth.session import (
    clear_auth_cookies,
    set_session_cookie,
)
from app.auth.workos import get_workos
from app.config import get_settings
from app.utils.url import origin_of

router = APIRouter(tags=["auth"])


@router.get("/login/")
def login(return_to: str | None = None):
    settings = get_settings()
    workos = get_workos()

    # TODO: Replace the raw return URL with OAuth nonce because
    # maybe client URLs contain sensitive data or be super long.
    authorization_url = workos.user_management.get_authorization_url(
        provider="authkit",
        redirect_uri=f"{settings.API_URL}/callback",
        state=_safe_return_to_url(return_to),
    )

    return RedirectResponse(url=authorization_url, status_code=status.HTTP_302_FOUND)


@router.get("/callback/")
def callback(code: str, state: str | None):
    settings = get_settings()
    workos = get_workos()
    return_to = _safe_return_to_url(state)

    try:
        auth_response = workos.user_management.authenticate_with_code(
            code=code,
            session={
                "seal_session": True,
                "cookie_password": settings.WORKOS_COOKIE_PASSWORD,
            },
        )

        resp = RedirectResponse(url=return_to, status_code=status.HTTP_302_FOUND)
        set_session_cookie(resp, auth_response.sealed_session)

        return resp
    except Exception as e:
        print("Error authenticating with code", e)
        retry_url = f"/login/?{urlencode({'return_to': return_to})}"
        return RedirectResponse(url=retry_url, status_code=status.HTTP_302_FOUND)


@router.get("/logout/")
def logout(request: Request):
    settings = get_settings()
    workos = get_workos()
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get(settings.WORKOS_COOKIE_NAME),
        cookie_password=settings.WORKOS_COOKIE_PASSWORD,
    )

    try:
        resp = RedirectResponse(
            url=session.get_logout_url(), status_code=status.HTTP_302_FOUND
        )
        clear_auth_cookies(resp)
        return resp
    except Exception:
        resp = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
        clear_auth_cookies(resp)
        return resp


def _safe_return_to_url(url: str | None = None) -> str:
    """
    Return `url` only if it targets APP_URL or APP_V2_URL,
    else APP_URL.

    (To prevent malicious redirects)
    """
    settings = get_settings()

    if url is None:
        return settings.APP_URL

    origin = origin_of(url)
    allowed = {
        origin_of(settings.APP_URL),
        origin_of(settings.APP_V2_URL),
    }

    return url if origin in allowed else settings.APP_URL
