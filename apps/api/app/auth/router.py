"""Auth HTTP endpoints - login, callback, logout."""

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from starlette import status

from app.auth.session import (
    authenticate_session,
    clear_auth_cookies,
    cookie_domain,
    set_session_cookie,
)
from app.auth.workos import get_workos
from app.config import get_settings

router = APIRouter(tags=["auth"])


@router.get("/login/")
def login():
    settings = get_settings()
    workos = get_workos()
    authorization_url = workos.user_management.get_authorization_url(
        provider="authkit", redirect_uri=f"{settings.API_URL}/callback"
    )

    return RedirectResponse(url=authorization_url, status_code=status.HTTP_302_FOUND)


@router.get("/callback/")
def callback(code: str):
    settings = get_settings()
    workos = get_workos()
    try:
        auth_response = workos.user_management.authenticate_with_code(
            code=code,
            session={
                "seal_session": True,
                "cookie_password": settings.WORKOS_COOKIE_PASSWORD,
            },
        )

        resp = RedirectResponse(url=settings.APP_URL, status_code=status.HTTP_302_FOUND)
        set_session_cookie(resp, auth_response.sealed_session)

        return resp
    except Exception as e:
        print("Error authenticating with code", e)
        return RedirectResponse(url="/login/", status_code=status.HTTP_302_FOUND)


@router.get("/auth/check/")
def check_auth(request: Request, fallback: str | None = None):
    """Redirect to the app if authenticated, otherwise to fallback URL."""
    settings = get_settings()
    validated_fallback = _validate_fallback(fallback)
    result = authenticate_session(request.cookies.get(settings.WORKOS_COOKIE_NAME))

    if result.authenticated:
        response = RedirectResponse(
            url=settings.APP_URL, status_code=status.HTTP_302_FOUND
        )
        if result.sealed_session is not None:
            set_session_cookie(response, result.sealed_session)
        return response

    target_url = validated_fallback or "/login/"
    response = RedirectResponse(url=target_url, status_code=status.HTTP_302_FOUND)
    clear_auth_cookies(response)
    return response


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


def _validate_fallback(fallback: str | None) -> str | None:
    if not fallback:
        return None

    from urllib.parse import urlparse

    settings = get_settings()
    parsed = urlparse(fallback)
    domain = cookie_domain(settings.DOMAIN).lower()
    if parsed.hostname and (
        parsed.hostname.lower() == domain
        or parsed.hostname.lower().endswith(f".{domain}")
    ):
        return fallback

    return None
