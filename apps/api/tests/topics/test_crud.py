"""Integration tests for topics endpoints."""

from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Practice, Source, Topic


class TestTopicsEndpoints:
    """Integration tests for /topics endpoints."""

    async def test_list_topics_returns_empty_for_new_user(
        self,
        test_client: AsyncClient,
    ):
        """New user should have no topics."""
        response = await test_client.get("/topics/")

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_topics_returns_user_topics(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should return topics for the authenticated user."""
        await create_test_topic(name="My Test Topic")
        await create_test_topic(user_id="other-user", name="Other User Topic")

        response = await test_client.get("/topics/")

        assert response.status_code == 200
        topics = response.json()
        assert len(topics) == 1
        assert topics[0]["name"] == "My Test Topic"

    async def test_create_topic_success(
        self,
        test_client: AsyncClient,
    ):
        """Should create a new topic."""
        response = await test_client.post(
            "/topics/",
            json={
                "name": "New Topic",
                "notes": "Some notes",
                "srs_enabled": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Topic"
        assert data["notes"] == "Some notes"
        assert data["id"] is not None

    async def test_get_topic_by_id(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should return a specific topic by ID."""
        topic = await create_test_topic(name="Specific Topic")

        response = await test_client.get(f"/topics/{topic.id}/")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == topic.id
        assert data["name"] == "Specific Topic"

    async def test_get_topic_not_found(
        self,
        test_client: AsyncClient,
    ):
        """Should return 404 for non-existent topic."""
        response = await test_client.get("/topics/99999/")

        assert response.status_code == 404

    async def test_delete_topic_success(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should delete a topic."""
        topic = await create_test_topic(name="Topic to Delete")

        response = await test_client.delete(f"/topics/{topic.id}/")
        assert response.status_code == 200

        # Verify topic is gone via API
        get_response = await test_client.get(f"/topics/{topic.id}/")
        assert get_response.status_code == 404

    async def test_update_topic_success(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should update a topic."""
        topic = await create_test_topic(name="Original Name")

        response = await test_client.patch(
            f"/topics/{topic.id}/",
            json={"name": "Updated Name"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"


class TestInheritFsrs:
    """Tests for inherit_fsrs feature when creating child topics."""

    async def test_inherit_fsrs_populates_inherited_fields(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """Child topic should copy parent's FSRS state to inherited_* fields."""
        # Create parent and do a completed review to populate FSRS state
        parent = await create_test_topic(name="Parent Topic")
        await test_client.post(
            "/reviews/",
            json={
                "topic_id": parent.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        # Refresh parent to get updated FSRS state
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == parent.id)
            .options(selectinload(Topic.fsrs_state))
        )
        parent = result.scalar_one()

        # Create child with inherit_fsrs=True
        response = await test_client.post(
            "/topics/",
            json={
                "name": "Child Topic",
                "parent_id": parent.id,
                "srs_enabled": True,
                "inherit_fsrs": True,
            },
        )

        assert response.status_code == 200
        child_id = response.json()["id"]

        # Verify child inherited parent's FSRS values
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == child_id)
            .options(selectinload(Topic.fsrs_state))
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
        create_test_topic,
    ):
        """First review on child should use inherited FSRS state as 'before' state.

        This verifies that inherited values actually affect FSRS calculations,
        not just that they're stored.
        """
        # Create parent and do reviews to build up FSRS state
        parent = await create_test_topic(name="Parent Topic")
        await test_client.post(
            "/reviews/",
            json={
                "topic_id": parent.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        # Refresh parent to get updated FSRS state
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == parent.id)
            .options(selectinload(Topic.fsrs_state))
        )
        parent = result.scalar_one()
        parent_stability = parent.fsrs_state.stability
        parent_difficulty = parent.fsrs_state.difficulty
        parent_state = parent.fsrs_state.state

        # Create child with inherit_fsrs=True
        child_response = await test_client.post(
            "/topics/",
            json={
                "name": "Child Topic",
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
                "topic_id": child_id,
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
        create_test_topic,
    ):
        """Child without inherit_fsrs should start with null FSRS state.

        Compare to inherited child to show the difference.
        """
        # Create parent with established FSRS state
        parent = await create_test_topic(name="Parent Topic")
        await test_client.post(
            "/reviews/",
            json={
                "topic_id": parent.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        # Create child WITHOUT inherit_fsrs
        child_response = await test_client.post(
            "/topics/",
            json={
                "name": "Child Without Inheritance",
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
                "topic_id": child_id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert review_response.status_code == 200
        review_data = review_response.json()

        # The "before" state should be null (no inheritance), except state
        # which defaults to LEARNING for new topics
        assert review_data["stability_before"] is None
        assert review_data["difficulty_before"] is None
        assert review_data["state_before"] == "LEARNING"


class TestCrossEntityInheritFsrs:
    """Tests for inherit_fsrs when creating cross-entity relationships from topics."""

    async def test_topic_to_source_inherit_fsrs(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        topic = await create_test_topic(
            name="Topic Source Parent",
            initial_stability=2.5,
            initial_difficulty=3.1,
            initial_state="REVIEW",
            initial_step=1,
        )

        response = await test_client.post(
            f"/topics/{topic.id}/sources/",
            json={
                "source": {
                    "title": "Inherited Source",
                    "notes": "",
                    "archived": False,
                    "inboxed": False,
                    "srs_enabled": False,
                    "inherit_fsrs": True,
                }
            },
        )

        assert response.status_code == 201
        source_id = response.json()["source"]["id"]

        result = await db_session.execute(
            select(Source)
            .where(Source.id == source_id)
            .options(selectinload(Source.fsrs_state))
        )
        source = result.scalar_one()

        assert source.fsrs_state is not None
        assert source.fsrs_state.srs_enabled is False
        assert source.fsrs_state.inherited_stability == pytest.approx(
            topic.fsrs_state.stability
        )
        assert source.fsrs_state.inherited_difficulty == pytest.approx(
            topic.fsrs_state.difficulty
        )
        assert source.fsrs_state.inherited_state == topic.fsrs_state.state

    async def test_topic_to_practice_inherit_fsrs(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
        mock_user_id: str,
    ):
        topic = await create_test_topic(
            name="Topic Practice Parent",
            initial_stability=1.7,
            initial_difficulty=2.9,
            initial_state="REVIEW",
            initial_step=2,
        )

        prompt = "Inherited Practice From Topic"
        response = await test_client.post(
            f"/topics/{topic.id}/practices/",
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
            topic.fsrs_state.stability
        )
        assert practice.fsrs_state.inherited_difficulty == pytest.approx(
            topic.fsrs_state.difficulty
        )
        assert practice.fsrs_state.inherited_state == topic.fsrs_state.state
