"""Integration tests for sources endpoints."""

from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Practice, Source, Topic


class TestSourcesEndpoints:
    """Integration tests for /sources endpoints."""

    async def test_list_sources_returns_empty_for_new_user(
        self,
        test_client: AsyncClient,
    ):
        """New user should have no sources."""
        response = await test_client.get("/sources/")

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_sources_returns_user_sources(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should return sources for the authenticated user."""
        await create_test_source(title="My Test Source")
        await create_test_source(user_id="other-user", title="Other User Source")

        response = await test_client.get("/sources/")

        assert response.status_code == 200
        sources = response.json()
        assert len(sources) == 1
        assert sources[0]["title"] == "My Test Source"
        assert sources[0]["last_review_rating"] is None

    async def test_create_source_success(
        self,
        test_client: AsyncClient,
    ):
        """Should create a new source."""
        response = await test_client.post(
            "/sources/",
            json={
                "title": "New Source",
                "notes": "Some notes",
                "srs_enabled": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New Source"
        assert data["notes"] == "Some notes"
        assert data["id"] is not None

    async def test_get_source_by_id(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should return a specific source by ID."""
        source = await create_test_source(title="Specific Source")

        response = await test_client.get(f"/sources/{source.id}/")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == source.id
        assert data["title"] == "Specific Source"

    async def test_get_source_not_found(
        self,
        test_client: AsyncClient,
    ):
        """Should return 404 for non-existent source."""
        response = await test_client.get("/sources/99999/")

        assert response.status_code == 404

    async def test_delete_source_success(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should delete a source."""
        source = await create_test_source(title="Source to Delete")

        response = await test_client.delete(f"/sources/{source.id}/")
        assert response.status_code == 200

        # Verify source is gone via API
        get_response = await test_client.get(f"/sources/{source.id}/")
        assert get_response.status_code == 404

    async def test_update_source_success(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should update a source."""
        source = await create_test_source(title="Original Title")

        response = await test_client.patch(
            f"/sources/{source.id}/",
            json={"title": "Updated Title"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"


class TestInheritFsrs:
    """Tests for inherit_fsrs feature when creating child sources."""

    async def test_inherit_fsrs_populates_inherited_fields(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """Child source should copy parent's FSRS state to inherited_* fields."""
        # Create parent and do a completed review to populate FSRS state
        parent = await create_test_source(title="Parent Source")
        await test_client.post(
            "/reviews/",
            json={
                "source_id": parent.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        # Refresh parent to get updated FSRS state
        result = await db_session.execute(
            select(Source)
            .where(Source.id == parent.id)
            .options(selectinload(Source.fsrs_state))
        )
        parent = result.scalar_one()

        # Create child with inherit_fsrs=True
        response = await test_client.post(
            "/sources/",
            json={
                "title": "Child Source",
                "parent_id": parent.id,
                "srs_enabled": True,
                "inherit_fsrs": True,
            },
        )

        assert response.status_code == 200
        child_id = response.json()["id"]

        # Verify child inherited parent's FSRS values
        result = await db_session.execute(
            select(Source)
            .where(Source.id == child_id)
            .options(selectinload(Source.fsrs_state))
        )
        child = result.scalar_one()

        assert child.fsrs_state.inherited_stability == pytest.approx(
            parent.fsrs_state.stability
        )
        assert child.fsrs_state.inherited_difficulty == pytest.approx(
            parent.fsrs_state.difficulty
        )
        assert child.fsrs_state.inherited_state == parent.fsrs_state.state

    async def test_review_uses_inherited_fsrs_as_starting_point(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """First review on child should use inherited FSRS state as 'before' state.

        This verifies that inherited values actually affect FSRS calculations,
        not just that they're stored.
        """
        # Create parent and do reviews to build up FSRS state
        parent = await create_test_source(title="Parent Source")
        await test_client.post(
            "/reviews/",
            json={
                "source_id": parent.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        # Refresh parent to get updated FSRS state
        result = await db_session.execute(
            select(Source)
            .where(Source.id == parent.id)
            .options(selectinload(Source.fsrs_state))
        )
        parent = result.scalar_one()
        parent_stability = parent.fsrs_state.stability
        parent_difficulty = parent.fsrs_state.difficulty
        parent_state = parent.fsrs_state.state

        # Create child with inherit_fsrs=True
        child_response = await test_client.post(
            "/sources/",
            json={
                "title": "Child Source",
                "parent_id": parent.id,
                "srs_enabled": True,
                "inherit_fsrs": True,
            },
        )
        child_id = child_response.json()["id"]

        # Create a review on the child - inherited values should be used as "before" state
        review_response = await test_client.post(
            "/reviews/",
            json={
                "source_id": child_id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert review_response.status_code == 200
        review_data = review_response.json()

        # The "before" state should match the inherited values from parent
        assert review_data["stability_before"] == pytest.approx(parent_stability)
        assert review_data["difficulty_before"] == pytest.approx(parent_difficulty)
        assert review_data["state_before"] == parent_state

        # The "after" state should be calculated (FSRS calculation applied)
        assert review_data["stability_after"] is not None
        assert review_data["difficulty_after"] is not None

    async def test_review_without_inherit_fsrs_starts_fresh(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """Child without inherit_fsrs should start with null FSRS state.

        Compare to inherited child to show the difference.
        """
        # Create parent with established FSRS state
        parent = await create_test_source(title="Parent Source")
        await test_client.post(
            "/reviews/",
            json={
                "source_id": parent.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        # Create child WITHOUT inherit_fsrs
        child_response = await test_client.post(
            "/sources/",
            json={
                "title": "Child Without Inheritance",
                "parent_id": parent.id,
                "srs_enabled": True,
                "inherit_fsrs": False,
            },
        )
        child_id = child_response.json()["id"]

        # Create a review on the child
        review_response = await test_client.post(
            "/reviews/",
            json={
                "source_id": child_id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert review_response.status_code == 200
        review_data = review_response.json()

        # The "before" state should be null (no inheritance), except state
        # which defaults to LEARNING for new sources
        assert review_data["stability_before"] is None
        assert review_data["difficulty_before"] is None
        assert review_data["state_before"] == "LEARNING"


class TestCrossEntityInheritFsrs:
    """Tests for inherit_fsrs when creating cross-entity relationships from sources."""

    async def test_source_to_topic_inherit_fsrs(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        source = await create_test_source(
            title="Source Topic Parent",
            initial_stability=3.3,
            initial_difficulty=2.2,
            initial_state="REVIEW",
            initial_step=1,
        )

        response = await test_client.post(
            f"/sources/{source.id}/topics/",
            json={
                "topic": {
                    "name": "Inherited Topic",
                    "notes": "",
                    "archived": False,
                    "inboxed": False,
                    "srs_enabled": False,
                    "inherit_fsrs": True,
                }
            },
        )

        assert response.status_code == 200
        topic_id = response.json()["topic"]["id"]

        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic_id)
            .options(selectinload(Topic.fsrs_state))
        )
        topic = result.scalar_one()

        assert topic.fsrs_state is not None
        assert topic.fsrs_state.srs_enabled is False
        assert topic.fsrs_state.inherited_stability == pytest.approx(
            source.fsrs_state.stability
        )
        assert topic.fsrs_state.inherited_difficulty == pytest.approx(
            source.fsrs_state.difficulty
        )
        assert topic.fsrs_state.inherited_state == source.fsrs_state.state

    async def test_topic_source_association_endpoints_include_parent(
        self,
        test_client: AsyncClient,
        create_test_topic,
        create_test_source,
    ):
        topic_parent = await create_test_topic(name="Topic Parent")
        topic_child = await create_test_topic(
            name="Topic Child", parent_id=topic_parent.id
        )
        source_parent = await create_test_source(title="Source Parent")
        source_child = await create_test_source(
            title="Source Child", parent_id=source_parent.id
        )

        link_response = await test_client.post(
            f"/sources/{source_child.id}/topics/",
            json={"topic_id": topic_child.id},
        )
        assert link_response.status_code == 200
        link_payload = link_response.json()
        assert link_payload["topic"]["parent"]["id"] == topic_parent.id
        assert link_payload["source"]["parent"]["id"] == source_parent.id

        topic_sources = await test_client.get(f"/topics/{topic_child.id}/sources/")
        assert topic_sources.status_code == 200
        assert topic_sources.json()[0]["parent"]["id"] == source_parent.id

        source_topics = await test_client.get(f"/sources/{source_child.id}/topics/")
        assert source_topics.status_code == 200
        assert source_topics.json()[0]["parent"]["id"] == topic_parent.id

    async def test_source_to_practice_inherit_fsrs(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
        mock_user_id: str,
    ):
        source = await create_test_source(
            title="Source Practice Parent",
            initial_stability=2.1,
            initial_difficulty=1.9,
            initial_state="REVIEW",
            initial_step=2,
        )

        prompt = "Inherited Practice From Source"
        response = await test_client.post(
            f"/sources/{source.id}/practices/",
            json={
                "practice": {
                    "prompt": prompt,
                    "answer": "Answer",
                    "archived": False,
                    "inboxed": False,
                    "srs_enabled": False,
                    "inherit_fsrs": True,
                }
            },
        )

        assert response.status_code == 201

        result = await db_session.execute(
            select(Practice)
            .where(Practice.prompt == prompt, Practice.user_id == mock_user_id)
            .options(selectinload(Practice.fsrs_state))
        )
        practice = result.scalar_one()

        assert practice.fsrs_state is not None
        assert practice.fsrs_state.srs_enabled is False
        assert practice.fsrs_state.inherited_stability == pytest.approx(
            source.fsrs_state.stability
        )
        assert practice.fsrs_state.inherited_difficulty == pytest.approx(
            source.fsrs_state.difficulty
        )
        assert practice.fsrs_state.inherited_state == source.fsrs_state.state
