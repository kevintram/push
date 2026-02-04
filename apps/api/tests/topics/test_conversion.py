"""Tests for topic entity conversion."""

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import t_practice_sources, t_practice_topics


class TestConvertTopicToSource:
    """Tests for Topic -> Source conversion."""

    async def test_convert_simple_topic(
        self, test_client: AsyncClient, create_test_topic
    ):
        """Converting a topic with no children or relationships works."""
        topic = await create_test_topic(name="Test Topic", notes="Some notes")

        response = await test_client.post(f"/topics/{topic.id}/convert-to-source/")

        assert response.status_code == 200
        data = response.json()
        assert "source_id" in data

        # Verify source was created
        source_response = await test_client.get(f"/sources/{data['source_id']}/")
        assert source_response.status_code == 200
        source_data = source_response.json()
        assert source_data["title"] == "Test Topic"
        assert source_data["notes"] == "Some notes"

        # Verify topic was deleted
        topic_response = await test_client.get(f"/topics/{topic.id}/")
        assert topic_response.status_code == 404

    async def test_convert_topic_preserves_flags(
        self, test_client: AsyncClient, create_test_topic
    ):
        """Converting preserves archived and inboxed flags."""
        topic = await create_test_topic(name="Flagged Topic")
        # Set flags via PATCH
        await test_client.patch(
            f"/topics/{topic.id}/", json={"archived": True, "inboxed": True}
        )

        response = await test_client.post(f"/topics/{topic.id}/convert-to-source/")

        assert response.status_code == 200
        source_id = response.json()["source_id"]

        source_response = await test_client.get(f"/sources/{source_id}/")
        source_data = source_response.json()
        assert source_data["archived"] is True
        assert source_data["inboxed"] is True

    async def test_convert_topic_with_children(
        self, test_client: AsyncClient, create_test_topic
    ):
        """Converting a topic with children converts entire subtree."""
        parent = await create_test_topic(name="Parent")
        child1 = await create_test_topic(name="Child 1", parent_id=parent.id)
        child2 = await create_test_topic(name="Child 2", parent_id=parent.id)
        grandchild = await create_test_topic(name="Grandchild", parent_id=child1.id)

        response = await test_client.post(f"/topics/{parent.id}/convert-to-source/")

        assert response.status_code == 200
        new_source_id = response.json()["source_id"]

        # Verify root source was created with correct title
        source_response = await test_client.get(f"/sources/{new_source_id}/")
        assert source_response.status_code == 200
        source_data = source_response.json()
        assert source_data["title"] == "Parent"
        assert source_data["children_count"] == 2

        # Verify all original topics were deleted
        for topic in [parent, child1, child2, grandchild]:
            topic_response = await test_client.get(f"/topics/{topic.id}/")
            assert topic_response.status_code == 404

    async def test_convert_topic_with_practices(
        self,
        test_client: AsyncClient,
        create_test_topic,
        create_test_practice,
        db_session: AsyncSession,
    ):
        """Practices linked to topic become linked to new source."""
        topic = await create_test_topic(name="Test Topic")
        practice = await create_test_practice(prompt="Test Practice")

        # Link practice to topic
        link_response = await test_client.post(
            f"/topics/{topic.id}/practices/", json={"practice_id": practice.id}
        )
        assert link_response.status_code == 201

        response = await test_client.post(f"/topics/{topic.id}/convert-to-source/")

        assert response.status_code == 200
        new_source_id = response.json()["source_id"]

        # Verify practice is linked to new source (via database since API might not expose this directly)
        result = await db_session.execute(
            select(t_practice_sources).where(
                t_practice_sources.c.source_id == new_source_id,
                t_practice_sources.c.practice_id == practice.id,
            )
        )
        assert result.first() is not None

    async def test_convert_topic_with_reviews(
        self, test_client: AsyncClient, create_test_topic
    ):
        """Reviews linked to topic are migrated to new source."""
        topic = await create_test_topic(name="Test Topic", notes="Some notes")

        # Create a review for the topic
        review_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "completed_at": "2024-01-15",
            },
        )
        assert review_response.status_code == 200
        review_id = review_response.json()["id"]

        response = await test_client.post(f"/topics/{topic.id}/convert-to-source/")
        assert response.status_code == 200
        new_source_id = response.json()["source_id"]

        # Verify review was migrated to new source
        reviews_response = await test_client.get(f"/reviews/?source_id={new_source_id}")
        assert reviews_response.status_code == 200
        reviews = reviews_response.json()
        assert len(reviews) == 1
        assert reviews[0]["id"] == review_id

    async def test_convert_blocked_by_covering_source(
        self, test_client: AsyncClient, create_test_topic, create_test_source
    ):
        """Conversion fails if topic has sources covering it."""
        topic = await create_test_topic(name="Test Topic")
        source = await create_test_source(title="Covering Source")

        # Add topic to source (source covers topic)
        link_response = await test_client.post(
            f"/sources/{source.id}/topics/", json={"topic_id": topic.id}
        )
        assert link_response.status_code == 200

        response = await test_client.post(f"/topics/{topic.id}/convert-to-source/")

        assert response.status_code == 409
        assert "sources covering" in response.json()["detail"].lower()

    async def test_convert_blocked_by_child_covering_source(
        self, test_client: AsyncClient, create_test_topic, create_test_source
    ):
        """Conversion fails if any child topic has sources covering it."""
        parent = await create_test_topic(name="Parent")
        child = await create_test_topic(name="Child", parent_id=parent.id)
        source = await create_test_source(title="Covering Source")

        # Add child topic to source
        link_response = await test_client.post(
            f"/sources/{source.id}/topics/", json={"topic_id": child.id}
        )
        assert link_response.status_code == 200

        response = await test_client.post(f"/topics/{parent.id}/convert-to-source/")

        assert response.status_code == 409

    async def test_convert_topic_not_found(self, test_client: AsyncClient):
        """Converting a non-existent topic returns 404."""
        response = await test_client.post("/topics/99999/convert-to-source/")
        assert response.status_code == 404


class TestConvertTopicToPractice:
    """Tests for Topic -> Practice conversion."""

    async def test_convert_simple_topic(
        self, test_client: AsyncClient, create_test_topic
    ):
        """Converting a topic with no blocking relationships works."""
        topic = await create_test_topic(name="Test Topic", notes="Answer text")

        response = await test_client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 200
        data = response.json()
        assert "practice_id" in data

        # Verify practice was created
        practice_response = await test_client.get(f"/practices/{data['practice_id']}/")
        assert practice_response.status_code == 200
        practice_data = practice_response.json()
        assert practice_data["prompt"] == "Test Topic"
        assert practice_data["answer"] == "Answer text"

        # Verify topic was deleted
        topic_response = await test_client.get(f"/topics/{topic.id}/")
        assert topic_response.status_code == 404

    async def test_convert_topic_preserves_flags(
        self, test_client: AsyncClient, create_test_topic
    ):
        """Converting preserves archived and inboxed flags."""
        topic = await create_test_topic(name="Flagged Topic")
        await test_client.patch(
            f"/topics/{topic.id}/", json={"archived": True, "inboxed": True}
        )

        response = await test_client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 200
        practice_id = response.json()["practice_id"]

        practice_response = await test_client.get(f"/practices/{practice_id}/")
        practice_data = practice_response.json()
        assert practice_data["archived"] is True
        assert practice_data["inboxed"] is True

    async def test_convert_topic_with_parents(
        self, test_client: AsyncClient, create_test_topic, db_session: AsyncSession
    ):
        """Only the direct parent becomes an associated topic of the new practice."""
        grandparent = await create_test_topic(name="Grandparent")
        parent = await create_test_topic(name="Parent", parent_id=grandparent.id)
        topic = await create_test_topic(name="Topic", parent_id=parent.id)

        response = await test_client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 200
        practice_id = response.json()["practice_id"]

        # Verify only direct parent is associated via practice_topics
        result = await db_session.execute(
            select(t_practice_topics.c.topic_id).where(
                t_practice_topics.c.practice_id == practice_id
            )
        )
        topic_ids = [row[0] for row in result.fetchall()]
        assert parent.id in topic_ids
        assert grandparent.id not in topic_ids

    async def test_convert_topic_with_related_topics(
        self, test_client: AsyncClient, create_test_topic, db_session: AsyncSession
    ):
        """Related topics become associated topics of the new practice."""
        topic = await create_test_topic(name="Topic")
        related1 = await create_test_topic(name="Related 1")

        # Create entity relation
        await test_client.post(
            f"/topics/{topic.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": related1.id},
        )

        response = await test_client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 200
        practice_id = response.json()["practice_id"]

        # Verify related topic is associated
        result = await db_session.execute(
            select(t_practice_topics.c.topic_id).where(
                t_practice_topics.c.practice_id == practice_id
            )
        )
        topic_ids = [row[0] for row in result.fetchall()]
        assert related1.id in topic_ids

    async def test_convert_topic_with_reviews(
        self, test_client: AsyncClient, create_test_topic
    ):
        """Reviews linked to topic are migrated to new practice."""
        topic = await create_test_topic(name="Test Topic", notes="Some notes")

        # Create a review for the topic
        review_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "completed_at": "2024-01-15",
            },
        )
        assert review_response.status_code == 200
        review_id = review_response.json()["id"]

        response = await test_client.post(f"/topics/{topic.id}/convert-to-practice/")
        assert response.status_code == 200
        new_practice_id = response.json()["practice_id"]

        # Verify review was migrated to new practice
        reviews_response = await test_client.get(
            f"/reviews/?practice_id={new_practice_id}"
        )
        assert reviews_response.status_code == 200
        reviews = reviews_response.json()
        assert len(reviews) == 1
        assert reviews[0]["id"] == review_id

    async def test_convert_blocked_by_existing_practices(
        self, test_client: AsyncClient, create_test_topic, create_test_practice
    ):
        """Conversion fails if topic has linked practices."""
        topic = await create_test_topic(name="Test Topic")
        practice = await create_test_practice(prompt="Test Practice")

        # Link practice to topic
        await test_client.post(
            f"/topics/{topic.id}/practices/", json={"practice_id": practice.id}
        )

        response = await test_client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 409
        assert "practice" in response.json()["detail"].lower()

    async def test_convert_blocked_by_covering_source(
        self, test_client: AsyncClient, create_test_topic, create_test_source
    ):
        """Conversion fails if topic has sources covering it."""
        topic = await create_test_topic(name="Test Topic")
        source = await create_test_source(title="Covering Source")

        # Add topic to source
        await test_client.post(
            f"/sources/{source.id}/topics/", json={"topic_id": topic.id}
        )

        response = await test_client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 409
        assert "source" in response.json()["detail"].lower()

    async def test_convert_topic_not_found(self, test_client: AsyncClient):
        """Converting a non-existent topic returns 404."""
        response = await test_client.post("/topics/99999/convert-to-practice/")
        assert response.status_code == 404

    async def test_convert_topic_with_children_blocked(
        self, test_client: AsyncClient, create_test_topic
    ):
        """Topic with children cannot be converted to practice."""
        parent = await create_test_topic(name="Parent")
        await create_test_topic(name="Child", parent_id=parent.id)

        response = await test_client.post(f"/topics/{parent.id}/convert-to-practice/")

        assert response.status_code == 409
        assert "children" in response.json()["detail"].lower()
