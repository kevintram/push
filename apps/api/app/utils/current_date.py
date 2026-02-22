from __future__ import annotations

from contextvars import ContextVar, Token
from datetime import date

_request_current_date: ContextVar[date | None] = ContextVar(
    "request_current_date", default=None
)


def parse_iso_date(value: str | None) -> date | None:
    if value is None:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def set_request_current_date(current_date: date | None) -> Token[date | None]:
    return _request_current_date.set(current_date)


def reset_request_current_date(token: Token[date | None]) -> None:
    _request_current_date.reset(token)


def get_current_date() -> date:
    return _request_current_date.get() or date.today()
