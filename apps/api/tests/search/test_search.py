"""Integration tests for unified search endpoint."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.search import service as search_service


class TestSearchEndpoint:
    """Integration tests for /search endpoint."""

    async def test_search_topics_with_parents_does_not_500(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        monkeypatch,
        create_test_topic,
    ):
        """Search should serialize topic.parent without triggering async lazy load."""
        test_session_factory = async_sessionmaker(
            bind=db_session.bind,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        monkeypatch.setattr(
            search_service, "get_session_factory", lambda: test_session_factory
        )

        parent = await create_test_topic(name="Search Parent Topic")
        await create_test_topic(name="Search Child Topic", parent_id=parent.id)

        response = await test_client.get(
            "/search/?entity_types=topic&inboxed=false&archived=false"
        )

        assert response.status_code == 200
        results = response.json()

        child = next(
            item
            for item in results
            if item["entity_type"] == "topic"
            and item["topic"]["name"] == "Search Child Topic"
        )
        assert child["topic"]["parent"]["id"] == parent.id

    async def test_search_sources_with_parents_does_not_500(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        monkeypatch,
        create_test_source,
    ):
        """Search should serialize source.parent without triggering async lazy load."""
        test_session_factory = async_sessionmaker(
            bind=db_session.bind,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        monkeypatch.setattr(
            search_service, "get_session_factory", lambda: test_session_factory
        )

        parent = await create_test_source(title="Search Parent Source")
        await create_test_source(title="Search Child Source", parent_id=parent.id)

        response = await test_client.get(
            "/search/?entity_types=source&inboxed=false&archived=false"
        )

        assert response.status_code == 200
        results = response.json()

        child = next(
            item
            for item in results
            if item["entity_type"] == "source"
            and item["source"]["title"] == "Search Child Source"
        )
        assert child["source"]["parent"]["id"] == parent.id
