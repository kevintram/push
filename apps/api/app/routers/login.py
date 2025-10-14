from workos import WorkOSClient
from app.core.config import settings
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from starlette import status

workos = WorkOSClient(
    api_key=settings.WORKOS_API_KEY, client_id=settings.WORKOS_CLIENT_ID
)

router = APIRouter()

SESSION_COOKIE_NAME = "wos_session"


@router.get("/login")
def login():
    authorization_url = workos.user_management.get_authorization_url(
        provider="authkit", redirect_uri="http://127.0.0.1:8000/callback"
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

        resp = RedirectResponse(
            url="http://localhost:5173", status_code=status.HTTP_302_FOUND
        )
        resp.set_cookie(
            SESSION_COOKIE_NAME,
            value=auth_response.sealed_session,
            secure=False,  # todo: set True in prod
            httponly=True,
            samesite="lax",
        )

        return resp
    except Exception as e:
        print("Error authenticating with code", e)
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)


@router.get("/logout")
def logout(request: Request):
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get(SESSION_COOKIE_NAME),
        cookie_password=settings.WORKOS_COOKIE_PASSWORD,
    )

    try:
        resp = RedirectResponse(
            url=session.get_logout_url(), status_code=status.HTTP_302_FOUND
        )
        resp.delete_cookie(SESSION_COOKIE_NAME)
        return resp
    except Exception:
        resp = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
        resp.delete_cookie(SESSION_COOKIE_NAME)
        return resp
