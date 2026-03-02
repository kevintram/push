"""Integration tests for unified note search endpoint."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.search import service as search_service


class TestSearchEndpoint:
    async def test_search_with_legacy_topic_filter_returns_note_payload(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        monkeypatch,
    ):
        test_session_factory = async_sessionmaker(
            bind=db_session.bind,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        monkeypatch.setattr(
            search_service, "get_session_factory", lambda: test_session_factory
        )

        topic_response = await test_client.post(
            "/notes/",
            json={
                "title": "Rust Ownership",
                "body": "Borrow checker basics",
                "tags": ["TOPIC"],
                "archived": False,
            },
        )
        assert topic_response.status_code == 201
        topic_note = topic_response.json()

        source_response = await test_client.post(
            "/notes/",
            json={
                "title": "Rust Book",
                "body": "Source note",
                "tags": ["SOURCE"],
                "archived": False,
            },
        )
        assert source_response.status_code == 201

        response = await test_client.get(
            "/search/?query=rust&entity_types=topic&archived=false"
        )

        assert response.status_code == 200
        results = response.json()
        assert len(results) == 1
        assert results[0]["entity_type"] == "note"
        assert results[0]["note"]["id"] == topic_note["id"]
        assert "TOPIC" in results[0]["note"]["tags"]

    async def test_search_entity_types_note_includes_all_matching_note_tags(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        monkeypatch,
    ):
        test_session_factory = async_sessionmaker(
            bind=db_session.bind,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        monkeypatch.setattr(
            search_service, "get_session_factory", lambda: test_session_factory
        )

        topic_response = await test_client.post(
            "/notes/",
            json={"title": "Queue theory", "body": "A", "tags": ["TOPIC"]},
        )
        assert topic_response.status_code == 201
        topic_note = topic_response.json()

        practice_response = await test_client.post(
            "/notes/",
            json={
                "title": "Queue practice prompt",
                "body": "B",
                "tags": ["PRACTICE"],
            },
        )
        assert practice_response.status_code == 201
        practice_note = practice_response.json()

        response = await test_client.get("/search/?query=queue&entity_types=note")

        assert response.status_code == 200
        results = response.json()
        ids = {item["note"]["id"] for item in results}
        assert topic_note["id"] in ids
        assert practice_note["id"] in ids
        assert all(item["entity_type"] == "note" for item in results)
