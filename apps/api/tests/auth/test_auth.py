from __future__ import annotations

from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi import Response
from starlette.requests import Request

import app.auth.dependencies as auth_dependencies
import app.auth.router as auth_router
import app.auth.session as auth_session
import app.exception_handlers as exception_handlers
from app.exceptions import AuthenticationError
from app.utils.url import origin_of


def make_request(*, cookie_header: str | None = None) -> Request:
    headers: list[tuple[bytes, bytes]] = []
    if cookie_header is not None:
        headers.append((b"cookie", cookie_header.encode()))

    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": headers,
            "query_string": b"",
            "scheme": "http",
            "server": ("testserver", 80),
            "client": ("127.0.0.1", 123),
            "root_path": "",
            "http_version": "1.1",
        }
    )


def make_settings():
    return SimpleNamespace(
        WORKOS_COOKIE_PASSWORD="test-cookie-password-32chars!!",
        WORKOS_COOKIE_NAME="test_session",
        APP_URL="http://app.example",
        APP_V2_URL="http://app-v2.example",
        API_URL="http://api.example",
        DOMAIN="example.com",
        ENV="test",
    )


class FakeSession:
    def __init__(self, auth_response, refresh_result=None, refresh_error=None):
        self._auth_response = auth_response
        self._refresh_result = refresh_result
        self._refresh_error = refresh_error

    def authenticate(self):
        return self._auth_response

    def refresh(self):
        if self._refresh_error is not None:
            raise self._refresh_error
        return self._refresh_result


def make_workos(session: FakeSession):
    user_management = SimpleNamespace(
        load_sealed_session=lambda sealed_session, cookie_password: session
    )
    return SimpleNamespace(user_management=user_management)


def response_cookie_headers(response: Response) -> list[str]:
    return response.headers.getlist("set-cookie")


@pytest.mark.parametrize(
    ("return_to", "expected"),
    [
        (None, "http://app.example"),
        (
            "http://app.example/reviews/123?tab=notes",
            "http://app.example/reviews/123?tab=notes",
        ),
        ("http://app-v2.example/settings", "http://app-v2.example/settings"),
        ("http://evil.example/phishing", "http://app.example"),
        ("javascript://app.example/phishing", "http://app.example"),
        ("http://app.example:9999/phishing", "http://app.example"),
        ("https://app.example/phishing", "http://app.example"),
        ("/reviews/123", "http://app.example"),
        ("not a url", "http://app.example"),
        ("http://app.example:bad/", "http://app.example"),
        ("http://[::1/", "http://app.example"),
    ],
)
def test_safe_return_to_url_allows_only_configured_app_origins(
    monkeypatch, return_to, expected
):
    settings = make_settings()
    monkeypatch.setattr(auth_router, "get_settings", lambda: settings)

    assert auth_router._safe_return_to_url(return_to) == expected


@pytest.mark.parametrize("url", ["http://app.example:bad/", "http://[::1/"])
def test_origin_of_returns_none_for_malformed_authority(url):
    assert origin_of(url) is None


def test_callback_preserves_return_url_when_authentication_fails(monkeypatch):
    settings = make_settings()

    def authenticate_with_code(**kwargs):
        raise RuntimeError("authentication failed")

    workos = SimpleNamespace(
        user_management=SimpleNamespace(
            authenticate_with_code=authenticate_with_code,
        )
    )
    monkeypatch.setattr(auth_router, "get_settings", lambda: settings)
    monkeypatch.setattr(auth_router, "get_workos", lambda: workos)

    response = auth_router.callback(
        code="authorization-code",
        state="http://app-v2.example/settings?tab=profile",
    )

    parsed_location = urlparse(response.headers["location"])
    assert parsed_location.path == "/login/"
    assert parse_qs(parsed_location.query) == {
        "return_to": ["http://app-v2.example/settings?tab=profile"]
    }


def test_authenticate_session_returns_authenticated_user(monkeypatch):
    settings = make_settings()
    session = FakeSession(
        auth_response=SimpleNamespace(
            authenticated=True,
            user=SimpleNamespace(id="user-123"),
            reason=None,
        )
    )

    monkeypatch.setattr(auth_session, "get_settings", lambda: settings)
    monkeypatch.setattr(auth_session, "get_workos", lambda: make_workos(session))

    result = auth_session.authenticate_session("sealed-cookie")

    assert result.authenticated is True
    assert result.user_id == "user-123"
    assert result.sealed_session is None


def test_authenticate_session_refreshes_stale_sessions(monkeypatch):
    settings = make_settings()
    session = FakeSession(
        auth_response=SimpleNamespace(
            authenticated=False,
            user=None,
            reason="expired_session",
        ),
        refresh_result=SimpleNamespace(
            authenticated=True,
            user=SimpleNamespace(id="user-123"),
            sealed_session="fresh-cookie",
        ),
    )

    monkeypatch.setattr(auth_session, "get_settings", lambda: settings)
    monkeypatch.setattr(auth_session, "get_workos", lambda: make_workos(session))

    result = auth_session.authenticate_session("stale-cookie")

    assert result.authenticated is True
    assert result.user_id == "user-123"
    assert result.sealed_session == "fresh-cookie"


@pytest.mark.asyncio
async def test_get_user_id_raises_clearable_auth_error_on_terminal_failure(monkeypatch):
    settings = make_settings()
    response = Response()

    monkeypatch.setattr(auth_dependencies, "get_settings", lambda: settings)
    monkeypatch.setattr(
        auth_dependencies,
        "authenticate_session",
        lambda session_cookie: auth_session.SessionAuthenticationResult(
            authenticated=False,
            failure_reason="Authentication failed",
        ),
    )

    with pytest.raises(AuthenticationError) as exc_info:
        await auth_dependencies.get_user_id(
            make_request(cookie_header="test_session=stale-cookie"),
            response,
        )

    assert exc_info.value.detail == "Authentication failed"
    assert exc_info.value.clear_auth_cookies is True


@pytest.mark.asyncio
async def test_get_user_id_sets_refreshed_cookie(monkeypatch):
    settings = make_settings()
    response = Response()
    set_cookie_calls: list[str] = []

    monkeypatch.setattr(auth_dependencies, "get_settings", lambda: settings)
    monkeypatch.setattr(
        auth_dependencies,
        "authenticate_session",
        lambda session_cookie: auth_session.SessionAuthenticationResult(
            authenticated=True,
            user_id="user-123",
            sealed_session="fresh-cookie",
        ),
    )
    monkeypatch.setattr(
        auth_dependencies,
        "set_session_cookie",
        lambda response, sealed_session: set_cookie_calls.append(sealed_session),
    )

    user_id = await auth_dependencies.get_user_id(
        make_request(cookie_header="test_session=stale-cookie"),
        response,
    )

    assert user_id == "user-123"
    assert set_cookie_calls == ["fresh-cookie"]


@pytest.mark.asyncio
async def test_authentication_handler_clears_auth_cookies(monkeypatch):
    settings = make_settings()
    monkeypatch.setattr(auth_session, "get_settings", lambda: settings)

    response = await exception_handlers.authentication_handler(
        make_request(),
        AuthenticationError("Authentication failed", clear_auth_cookies=True),
    )

    assert response.status_code == 401
    cookie_headers = response_cookie_headers(response)
    assert any(header.startswith("test_session=") for header in cookie_headers)
    assert any(header.startswith("logged_in=") for header in cookie_headers)
