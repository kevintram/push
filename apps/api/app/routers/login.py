from app.core.config import settings
from app.core.auth import workos
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from starlette import status

router = APIRouter()


@router.get("/login")
def login():
    authorization_url = workos.user_management.get_authorization_url(
        provider="authkit", redirect_uri=f"{settings.API_URL}/callback"
    )

    return RedirectResponse(url=authorization_url, status_code=status.HTTP_302_FOUND)


@router.get("/callback")
def callback(code: str):
    try:
        auth_response = workos.user_management.authenticate_with_code(
            code=code,
            session={
                "seal_session": True,
                "cookie_password": settings.WORKOS_COOKIE_PASSWORD,
            },
        )

        resp = RedirectResponse(url=settings.APP_URL, status_code=status.HTTP_302_FOUND)

        resp.set_cookie(
            settings.WORKOS_COOKIE_NAME,
            value=auth_response.sealed_session,
            secure=True if settings.ENV == "prod" else False,
            httponly=True,
            domain=settings.DOMAIN if settings.ENV == "prod" else None,
            samesite="lax",
        )

        return resp
    except Exception as e:
        print("Error authenticating with code", e)
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)


@router.get("/logout")
def logout(request: Request):
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get(settings.WORKOS_COOKIE_NAME),
        cookie_password=settings.WORKOS_COOKIE_PASSWORD,
    )

    try:
        resp = RedirectResponse(
            url=session.get_logout_url(), status_code=status.HTTP_302_FOUND
        )
        resp.delete_cookie(settings.WORKOS_COOKIE_NAME)
        return resp
    except Exception:
        resp = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
        resp.delete_cookie(settings.WORKOS_COOKIE_NAME)
        return resp
