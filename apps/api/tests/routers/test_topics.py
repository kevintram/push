from __future__ import annotations
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy.sql import Select

from app.routers.topics import search_topics


class _ScalarResultStub:
    def __init__(self, rows):
        self._rows = rows

    def scalars(self):
        return self

    def all(self):
        return self._rows


class _SessionStub:
    def __init__(self, rows):
        self._rows = rows
        self.last_statement: Select | None = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def execute(self, stmt: Select):
        self.last_statement = stmt
        return _ScalarResultStub(self._rows)


def _make_topic(**overrides):
    base = {
        "id": 1,
        "name": "Topic name",
        "notes": "Topic notes",
        "inserted_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "stability": 1,
        "retrievability": 0.1,
        "archived": False,
        "inboxed": False,
    }
    base.update(overrides)
    return SimpleNamespace(**base)


@pytest.mark.asyncio
async def test_search_topics_with_query_filters_and_orders_by_name():
    topic = _make_topic()
    session = _SessionStub([topic])

    results = await search_topics(
        session=session,
        user_id="user-123",
        query="Topic",
        limit=25,
    )

    assert results == [topic]
    assert session.last_statement is not None
    compiled = str(
        session.last_statement.compile(compile_kwargs={"literal_binds": True})
    )
    assert "ILIKE '%Topic%'" in compiled
    assert "ORDER BY topics.name ASC" in compiled
    assert "LIMIT 25" in compiled


@pytest.mark.asyncio
async def test_search_topics_without_query_returns_recent_topics():
    topic = _make_topic()
    session = _SessionStub([topic])

    results = await search_topics(
        session=session,
        user_id="user-123",
        query="",
    )

    assert results == [topic]
    assert session.last_statement is not None
    compiled = str(
        session.last_statement.compile(compile_kwargs={"literal_binds": True})
    )
    assert "ORDER BY topics.updated_at DESC" in compiled
    assert "LIMIT 10" in compiled


@pytest.mark.asyncio
async def test_search_topics_caps_limit_to_maximum():
    topic = _make_topic()
    session = _SessionStub([topic])

    await search_topics(
        session=session,
        user_id="user-123",
        query=None,
        limit=200,
    )

    assert session.last_statement is not None
    compiled = str(
        session.last_statement.compile(compile_kwargs={"literal_binds": True})
    )
    assert "LIMIT 50" in compiled
