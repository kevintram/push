"""Tests for source entity conversion."""

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EntityRelation, t_practice_sources, t_practice_topics


class TestConvertSourceToTopic:
    """Tests for Source -> Topic conversion."""

    async def test_convert_simple_source(
        self, test_client: AsyncClient, create_test_source
    ):
        """Converting a source with no children or relationships works."""
        source = await create_test_source(title="Test Source", notes="Some notes")

        response = await test_client.post(f"/sources/{source.id}/convert-to-topic/")

        assert response.status_code == 200
        data = response.json()
        assert "topic_id" in data

        # Verify topic was created with correct field mapping
        topic_response = await test_client.get(f"/topics/{data['topic_id']}/")
        assert topic_response.status_code == 200
        topic_data = topic_response.json()
        assert topic_data["name"] == "Test Source"
        assert topic_data["notes"] == "Some notes"

        # Verify source was deleted
        source_response = await test_client.get(f"/sources/{source.id}/")
        assert source_response.status_code == 404

    async def test_convert_source_appends_progress_note_to_topic_notes(
        self, test_client: AsyncClient, create_test_source
    ):
        """Source progress note is appended to converted topic notes."""
        source = await create_test_source(
            title="Test Source",
            notes="Some notes",
            progress_note="00:12:45",
        )

        response = await test_client.post(f"/sources/{source.id}/convert-to-topic/")
        assert response.status_code == 200
        topic_id = response.json()["topic_id"]

        topic_response = await test_client.get(f"/topics/{topic_id}/")
        assert topic_response.status_code == 200
        topic_data = topic_response.json()
        assert topic_data["notes"] == "Some notes\n\nProgress note:\n00:12:45"

    async def test_convert_source_preserves_flags(
        self, test_client: AsyncClient, create_test_source
    ):
        """Converting preserves archived and inboxed flags."""
        source = await create_test_source(title="Flagged Source")
        await test_client.patch(
            f"/sources/{source.id}/", json={"archived": True, "inboxed": True}
        )

        response = await test_client.post(f"/sources/{source.id}/convert-to-topic/")

        assert response.status_code == 200
        topic_id = response.json()["topic_id"]

        topic_response = await test_client.get(f"/topics/{topic_id}/")
        topic_data = topic_response.json()
        assert topic_data["archived"] is True
        assert topic_data["inboxed"] is True

    async def test_convert_source_with_children(
        self, test_client: AsyncClient, create_test_source
    ):
        """Converting a source with children converts entire subtree."""
        parent = await create_test_source(title="Parent")
        child1 = await create_test_source(title="Child 1", parent_id=parent.id)
        child2 = await create_test_source(title="Child 2", parent_id=parent.id)
        grandchild = await create_test_source(title="Grandchild", parent_id=child1.id)

        response = await test_client.post(f"/sources/{parent.id}/convert-to-topic/")

        assert response.status_code == 200
        new_topic_id = response.json()["topic_id"]

        # Verify root topic was created with correct name
        topic_response = await test_client.get(f"/topics/{new_topic_id}/")
        assert topic_response.status_code == 200
        topic_data = topic_response.json()
        assert topic_data["name"] == "Parent"
        assert topic_data["children_count"] == 2

        # Verify all original sources were deleted
        for source in [parent, child1, child2, grandchild]:
            source_response = await test_client.get(f"/sources/{source.id}/")
            assert source_response.status_code == 404

    async def test_convert_source_with_practices(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_practice,
        db_session: AsyncSession,
    ):
        """Practices linked to source become linked to new topic."""
        source = await create_test_source(title="Test Source")
        practice = await create_test_practice(prompt="Test Practice")

        # Link practice to source
        link_response = await test_client.post(
            f"/sources/{source.id}/practices/", json={"practice_id": practice.id}
        )
        assert link_response.status_code == 201

        response = await test_client.post(f"/sources/{source.id}/convert-to-topic/")

        assert response.status_code == 200
        new_topic_id = response.json()["topic_id"]

        # Verify practice is linked to new topic via practice_topics
        result = await db_session.execute(
            select(t_practice_topics).where(
                t_practice_topics.c.topic_id == new_topic_id,
                t_practice_topics.c.practice_id == practice.id,
            )
        )
        assert result.first() is not None

    async def test_convert_source_with_reviews(
        self, test_client: AsyncClient, create_test_source
    ):
        """Reviews linked to source are migrated to new topic."""
        source = await create_test_source(title="Test Source", notes="Some notes")

        # Create a review for the source
        review_response = await test_client.post(
            "/reviews/",
            json={
                "source_id": source.id,
                "completed_at": "2024-01-15",
            },
        )
        assert review_response.status_code == 200
        review_id = review_response.json()["id"]

        response = await test_client.post(f"/sources/{source.id}/convert-to-topic/")
        assert response.status_code == 200
        new_topic_id = response.json()["topic_id"]

        # Verify review was migrated to new topic
        reviews_response = await test_client.get(f"/reviews/?topic_id={new_topic_id}")
        assert reviews_response.status_code == 200
        reviews = reviews_response.json()
        assert len(reviews) == 1
        assert reviews[0]["id"] == review_id

    async def test_convert_source_with_entity_relations(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Entity relations are remapped to new topic."""
        source = await create_test_source(title="Test Source")
        related_topic = await create_test_topic(name="Related Topic")

        # Create entity relation: source -> topic
        await test_client.post(
            f"/sources/{source.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": related_topic.id},
        )

        response = await test_client.post(f"/sources/{source.id}/convert-to-topic/")
        assert response.status_code == 200
        new_topic_id = response.json()["topic_id"]

        # Verify entity relation was remapped: from_topic_id=new_topic, to_topic_id=related_topic
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == new_topic_id,
                EntityRelation.to_topic_id == related_topic.id,
            )
        )
        assert result.scalar_one_or_none() is not None

    async def test_convert_source_topics_to_entity_relations(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """source_topics entries become entity_relations after conversion."""
        source = await create_test_source(title="Test Source")
        covered_topic = await create_test_topic(name="Covered Topic")

        # Add topic to source (source covers topic)
        await test_client.post(
            f"/sources/{source.id}/topics/", json={"topic_id": covered_topic.id}
        )

        response = await test_client.post(f"/sources/{source.id}/convert-to-topic/")
        assert response.status_code == 200
        new_topic_id = response.json()["topic_id"]

        # Verify entity relation: new topic -> covered topic
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == new_topic_id,
                EntityRelation.to_topic_id == covered_topic.id,
            )
        )
        assert result.scalar_one_or_none() is not None

    async def test_convert_source_prerequisites_to_entity_relations(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """source_prerequisites become entity_relations after conversion."""
        source = await create_test_source(title="Test Source")
        prereq_topic = await create_test_topic(name="Prereq Topic")

        # Add prerequisite to source
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": prereq_topic.id},
        )

        response = await test_client.post(f"/sources/{source.id}/convert-to-topic/")
        assert response.status_code == 200
        new_topic_id = response.json()["topic_id"]

        # Verify entity relation: new topic -> prereq topic
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == new_topic_id,
                EntityRelation.to_topic_id == prereq_topic.id,
            )
        )
        assert result.scalar_one_or_none() is not None

    async def test_convert_source_not_found(self, test_client: AsyncClient):
        """Converting a non-existent source returns 404."""
        response = await test_client.post("/sources/99999/convert-to-topic/")
        assert response.status_code == 404


class TestConvertSourceToPractice:
    """Tests for Source -> Practice conversion."""

    async def test_convert_simple_source(
        self, test_client: AsyncClient, create_test_source
    ):
        """Converting a source with no children or blocking relationships works."""
        source = await create_test_source(title="Test Source", notes="Answer text")

        response = await test_client.post(f"/sources/{source.id}/convert-to-practice/")

        assert response.status_code == 200
        data = response.json()
        assert "practice_id" in data

        # Verify practice was created with correct field mapping
        practice_response = await test_client.get(f"/practices/{data['practice_id']}/")
        assert practice_response.status_code == 200
        practice_data = practice_response.json()
        assert practice_data["prompt"] == "Test Source"
        assert practice_data["answer"] == "Answer text"

        # Verify source was deleted
        source_response = await test_client.get(f"/sources/{source.id}/")
        assert source_response.status_code == 404

    async def test_convert_source_appends_progress_note_to_practice_answer(
        self, test_client: AsyncClient, create_test_source
    ):
        """Source progress note is appended to converted practice answer."""
        source = await create_test_source(
            title="Test Source",
            notes="Answer text",
            progress_note="Stopped at 14:22",
        )

        response = await test_client.post(f"/sources/{source.id}/convert-to-practice/")
        assert response.status_code == 200
        practice_id = response.json()["practice_id"]

        practice_response = await test_client.get(f"/practices/{practice_id}/")
        assert practice_response.status_code == 200
        practice_data = practice_response.json()
        assert (
            practice_data["answer"] == "Answer text\n\nProgress note:\nStopped at 14:22"
        )

    async def test_convert_source_preserves_flags(
        self, test_client: AsyncClient, create_test_source
    ):
        """Converting preserves archived and inboxed flags."""
        source = await create_test_source(title="Flagged Source")
        await test_client.patch(
            f"/sources/{source.id}/", json={"archived": True, "inboxed": True}
        )

        response = await test_client.post(f"/sources/{source.id}/convert-to-practice/")

        assert response.status_code == 200
        practice_id = response.json()["practice_id"]

        practice_response = await test_client.get(f"/practices/{practice_id}/")
        practice_data = practice_response.json()
        assert practice_data["archived"] is True
        assert practice_data["inboxed"] is True

    async def test_convert_source_with_reviews(
        self, test_client: AsyncClient, create_test_source
    ):
        """Reviews linked to source are migrated to new practice."""
        source = await create_test_source(title="Test Source", notes="Some notes")

        # Create a review for the source
        review_response = await test_client.post(
            "/reviews/",
            json={
                "source_id": source.id,
                "completed_at": "2024-01-15",
            },
        )
        assert review_response.status_code == 200
        review_id = review_response.json()["id"]

        response = await test_client.post(f"/sources/{source.id}/convert-to-practice/")
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

    async def test_convert_source_topics_to_practice_topics(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """source_topics entries become practice_topics after conversion."""
        source = await create_test_source(title="Test Source")
        covered_topic = await create_test_topic(name="Covered Topic")

        # Add topic to source
        await test_client.post(
            f"/sources/{source.id}/topics/", json={"topic_id": covered_topic.id}
        )

        response = await test_client.post(f"/sources/{source.id}/convert-to-practice/")
        assert response.status_code == 200
        new_practice_id = response.json()["practice_id"]

        # Verify practice_topics entry exists
        result = await db_session.execute(
            select(t_practice_topics).where(
                t_practice_topics.c.practice_id == new_practice_id,
                t_practice_topics.c.topic_id == covered_topic.id,
            )
        )
        assert result.first() is not None

    async def test_convert_child_source_links_practice_to_parent(
        self,
        test_client: AsyncClient,
        create_test_source,
        db_session: AsyncSession,
    ):
        """Converting a child source links the new practice to the parent source."""
        parent = await create_test_source(title="Parent Source")
        child = await create_test_source(
            title="Child Question", notes="Child Answer", parent_id=parent.id
        )

        response = await test_client.post(f"/sources/{child.id}/convert-to-practice/")

        assert response.status_code == 200
        new_practice_id = response.json()["practice_id"]

        # Verify practice is linked to parent source via practice_sources
        result = await db_session.execute(
            select(t_practice_sources).where(
                t_practice_sources.c.practice_id == new_practice_id,
                t_practice_sources.c.source_id == parent.id,
            )
        )
        assert result.first() is not None

        # Verify the practice appears in the parent source's practices list
        parent_response = await test_client.get(f"/sources/{parent.id}/practices/")
        assert parent_response.status_code == 200
        practices = parent_response.json()
        practice_ids = [p["id"] for p in practices]
        assert new_practice_id in practice_ids

    async def test_convert_blocked_by_children(
        self, test_client: AsyncClient, create_test_source
    ):
        """Conversion fails if source has children."""
        parent = await create_test_source(title="Parent")
        await create_test_source(title="Child", parent_id=parent.id)

        response = await test_client.post(f"/sources/{parent.id}/convert-to-practice/")

        assert response.status_code == 409
        assert "children" in response.json()["detail"].lower()

    async def test_convert_source_not_found(self, test_client: AsyncClient):
        """Converting a non-existent source returns 404."""
        response = await test_client.post("/sources/99999/convert-to-practice/")
        assert response.status_code == 404
