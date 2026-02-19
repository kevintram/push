"""Auth HTTP endpoints - login, callback, logout."""

from urllib.parse import urlparse

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from starlette import status

from app.config import get_settings
from app.auth.workos import get_workos

router = APIRouter(tags=["auth"])


def _cookie_domain(domain: str) -> str:
    """Return cookie-safe domain host (strip scheme if present)."""
    return (urlparse(domain).hostname or domain).lstrip(".")


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

        secure = settings.ENV == "prod"
        domain = _cookie_domain(settings.DOMAIN) if secure else None
        cookie_kwargs = dict(secure=secure, domain=domain, samesite="lax")

        resp.set_cookie(
            settings.WORKOS_COOKIE_NAME,
            value=auth_response.sealed_session,
            httponly=True,
            **cookie_kwargs,
        )
        resp.set_cookie(
            "logged_in",
            value="1",
            httponly=False,
            **cookie_kwargs,
        )

        return resp
    except Exception as e:
        print("Error authenticating with code", e)
        return RedirectResponse(url="/login/", status_code=status.HTTP_302_FOUND)


@router.get("/auth/check/")
def check_auth(request: Request, fallback: str | None = None):
    """Redirect to the app if authenticated, otherwise to fallback URL."""
    settings = get_settings()
    workos = get_workos()

    validated_fallback = None
    if fallback:
        parsed = urlparse(fallback)
        domain = _cookie_domain(settings.DOMAIN).lower()
        if parsed.hostname and (
            parsed.hostname.lower() == domain
            or parsed.hostname.lower().endswith(f".{domain}")
        ):
            validated_fallback = fallback

    session_cookie = request.cookies.get(settings.WORKOS_COOKIE_NAME)
    if session_cookie:
        try:
            session = workos.user_management.load_sealed_session(
                sealed_session=session_cookie,
                cookie_password=settings.WORKOS_COOKIE_PASSWORD,
            )
            result = session.authenticate()
            if result.authenticated:
                return RedirectResponse(
                    url=settings.APP_URL, status_code=status.HTTP_302_FOUND
                )
        except Exception:
            pass

    if validated_fallback:
        return RedirectResponse(
            url=validated_fallback, status_code=status.HTTP_302_FOUND
        )
    return RedirectResponse(url="/login/", status_code=status.HTTP_302_FOUND)


@router.get("/logout/")
def logout(request: Request):
    settings = get_settings()
    workos = get_workos()
    secure = settings.ENV == "prod"
    domain = _cookie_domain(settings.DOMAIN) if secure else None
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get(settings.WORKOS_COOKIE_NAME),
        cookie_password=settings.WORKOS_COOKIE_PASSWORD,
    )

    try:
        resp = RedirectResponse(
            url=session.get_logout_url(), status_code=status.HTTP_302_FOUND
        )
        resp.delete_cookie(
            settings.WORKOS_COOKIE_NAME, domain=domain, secure=secure, samesite="lax"
        )
        resp.delete_cookie("logged_in", domain=domain, secure=secure, samesite="lax")
        return resp
    except Exception:
        resp = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
        resp.delete_cookie(
            settings.WORKOS_COOKIE_NAME, domain=domain, secure=secure, samesite="lax"
        )
        resp.delete_cookie("logged_in", domain=domain, secure=secure, samesite="lax")
        return resp
