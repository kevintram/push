"""Tests for practice entity conversion."""

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EntityRelation, t_source_topics


class TestConvertPracticeToTopic:
    """Tests for Practice -> Topic conversion."""

    async def test_convert_simple_practice(
        self, test_client: AsyncClient, create_test_practice
    ):
        """Converting a practice with no relationships works."""
        practice = await create_test_practice(
            prompt="Test Prompt", answer="Test Answer"
        )

        response = await test_client.post(f"/practices/{practice.id}/convert-to-topic/")

        assert response.status_code == 200
        data = response.json()
        assert "topic_id" in data

        # Verify topic was created with correct field mapping
        topic_response = await test_client.get(f"/topics/{data['topic_id']}/")
        assert topic_response.status_code == 200
        topic_data = topic_response.json()
        assert topic_data["name"] == "Test Prompt"
        assert topic_data["notes"] == "Test Answer"

        # Verify practice was deleted
        practice_response = await test_client.get(f"/practices/{practice.id}/")
        assert practice_response.status_code == 404

    async def test_convert_practice_preserves_flags(
        self, test_client: AsyncClient, create_test_practice
    ):
        """Converting preserves archived and inboxed flags."""
        practice = await create_test_practice(prompt="Flagged Practice")
        await test_client.patch(
            f"/practices/{practice.id}/", json={"archived": True, "inboxed": True}
        )

        response = await test_client.post(f"/practices/{practice.id}/convert-to-topic/")

        assert response.status_code == 200
        topic_id = response.json()["topic_id"]

        topic_response = await test_client.get(f"/topics/{topic_id}/")
        topic_data = topic_response.json()
        assert topic_data["archived"] is True
        assert topic_data["inboxed"] is True

    async def test_convert_practice_with_reviews(
        self, test_client: AsyncClient, create_test_practice
    ):
        """Reviews linked to practice are migrated to new topic."""
        practice = await create_test_practice(prompt="Test Prompt", answer="Answer")

        # Create a review for the practice
        review_response = await test_client.post(
            "/reviews/",
            json={
                "practice_id": practice.id,
                "completed_at": "2024-01-15",
            },
        )
        assert review_response.status_code == 200
        review_id = review_response.json()["id"]

        response = await test_client.post(f"/practices/{practice.id}/convert-to-topic/")
        assert response.status_code == 200
        new_topic_id = response.json()["topic_id"]

        # Verify review was migrated to new topic
        reviews_response = await test_client.get(f"/reviews/?topic_id={new_topic_id}")
        assert reviews_response.status_code == 200
        reviews = reviews_response.json()
        assert len(reviews) == 1
        assert reviews[0]["id"] == review_id

    async def test_convert_practice_sources_to_source_topics(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_source,
        db_session: AsyncSession,
    ):
        """practice_sources entries become source_topics after conversion."""
        practice = await create_test_practice(prompt="Test Practice")
        source = await create_test_source(title="Linked Source")

        # Link source to practice
        await test_client.post(
            f"/practices/{practice.id}/sources/", json={"source_id": source.id}
        )

        response = await test_client.post(f"/practices/{practice.id}/convert-to-topic/")
        assert response.status_code == 200
        new_topic_id = response.json()["topic_id"]

        # Verify source_topics entry: linked source now covers new topic
        result = await db_session.execute(
            select(t_source_topics).where(
                t_source_topics.c.source_id == source.id,
                t_source_topics.c.topic_id == new_topic_id,
            )
        )
        assert result.first() is not None

    async def test_convert_practice_topics_to_entity_relations(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """practice_topics entries become entity_relations after conversion."""
        practice = await create_test_practice(prompt="Test Practice")
        linked_topic = await create_test_topic(name="Linked Topic")

        # Link topic to practice
        await test_client.post(
            f"/practices/{practice.id}/topics/", json={"topic_id": linked_topic.id}
        )

        response = await test_client.post(f"/practices/{practice.id}/convert-to-topic/")
        assert response.status_code == 200
        new_topic_id = response.json()["topic_id"]

        # Verify entity relation: new topic -> linked topic
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == new_topic_id,
                EntityRelation.to_topic_id == linked_topic.id,
            )
        )
        assert result.scalar_one_or_none() is not None

    async def test_convert_practice_not_found(self, test_client: AsyncClient):
        """Converting a non-existent practice returns 404."""
        response = await test_client.post("/practices/99999/convert-to-topic/")
        assert response.status_code == 404


class TestConvertPracticeToSource:
    """Tests for Practice -> Source conversion."""

    async def test_convert_simple_practice(
        self, test_client: AsyncClient, create_test_practice
    ):
        """Converting a practice with no relationships works."""
        practice = await create_test_practice(
            prompt="Test Prompt", answer="Test Answer"
        )

        response = await test_client.post(
            f"/practices/{practice.id}/convert-to-source/"
        )

        assert response.status_code == 200
        data = response.json()
        assert "source_id" in data

        # Verify source was created with correct field mapping
        source_response = await test_client.get(f"/sources/{data['source_id']}/")
        assert source_response.status_code == 200
        source_data = source_response.json()
        assert source_data["title"] == "Test Prompt"
        assert source_data["notes"] == "Test Answer"

        # Verify practice was deleted
        practice_response = await test_client.get(f"/practices/{practice.id}/")
        assert practice_response.status_code == 404

    async def test_convert_practice_preserves_flags(
        self, test_client: AsyncClient, create_test_practice
    ):
        """Converting preserves archived and inboxed flags."""
        practice = await create_test_practice(prompt="Flagged Practice")
        await test_client.patch(
            f"/practices/{practice.id}/", json={"archived": True, "inboxed": True}
        )

        response = await test_client.post(
            f"/practices/{practice.id}/convert-to-source/"
        )

        assert response.status_code == 200
        source_id = response.json()["source_id"]

        source_response = await test_client.get(f"/sources/{source_id}/")
        source_data = source_response.json()
        assert source_data["archived"] is True
        assert source_data["inboxed"] is True

    async def test_convert_practice_with_reviews(
        self, test_client: AsyncClient, create_test_practice
    ):
        """Reviews linked to practice are migrated to new source."""
        practice = await create_test_practice(prompt="Test Prompt", answer="Answer")

        # Create a review for the practice
        review_response = await test_client.post(
            "/reviews/",
            json={
                "practice_id": practice.id,
                "completed_at": "2024-01-15",
            },
        )
        assert review_response.status_code == 200
        review_id = review_response.json()["id"]

        response = await test_client.post(
            f"/practices/{practice.id}/convert-to-source/"
        )
        assert response.status_code == 200
        new_source_id = response.json()["source_id"]

        # Verify review was migrated to new source
        reviews_response = await test_client.get(f"/reviews/?source_id={new_source_id}")
        assert reviews_response.status_code == 200
        reviews = reviews_response.json()
        assert len(reviews) == 1
        assert reviews[0]["id"] == review_id

    async def test_convert_practice_topics_to_source_topics(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """practice_topics entries become source_topics after conversion."""
        practice = await create_test_practice(prompt="Test Practice")
        linked_topic = await create_test_topic(name="Linked Topic")

        # Link topic to practice
        await test_client.post(
            f"/practices/{practice.id}/topics/", json={"topic_id": linked_topic.id}
        )

        response = await test_client.post(
            f"/practices/{practice.id}/convert-to-source/"
        )
        assert response.status_code == 200
        new_source_id = response.json()["source_id"]

        # Verify source_topics entry: new source covers linked topic
        result = await db_session.execute(
            select(t_source_topics).where(
                t_source_topics.c.source_id == new_source_id,
                t_source_topics.c.topic_id == linked_topic.id,
            )
        )
        assert result.first() is not None

    async def test_convert_practice_sources_to_entity_relations(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_source,
        db_session: AsyncSession,
    ):
        """practice_sources entries become entity_relations after conversion."""
        practice = await create_test_practice(prompt="Test Practice")
        linked_source = await create_test_source(title="Linked Source")

        # Link source to practice
        await test_client.post(
            f"/practices/{practice.id}/sources/", json={"source_id": linked_source.id}
        )

        response = await test_client.post(
            f"/practices/{practice.id}/convert-to-source/"
        )
        assert response.status_code == 200
        new_source_id = response.json()["source_id"]

        # Verify entity relation: new source -> linked source
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_source_id == new_source_id,
                EntityRelation.to_source_id == linked_source.id,
            )
        )
        assert result.scalar_one_or_none() is not None

    async def test_convert_practice_not_found(self, test_client: AsyncClient):
        """Converting a non-existent practice returns 404."""
        response = await test_client.post("/practices/99999/convert-to-source/")
        assert response.status_code == 404
