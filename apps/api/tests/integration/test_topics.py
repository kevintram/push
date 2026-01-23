"""Integration tests for topics endpoints."""

from httpx import AsyncClient


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
