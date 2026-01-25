"""Integration tests for entity relations endpoints."""

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EntityRelation, SourcePrerequisite


class TestTopicEntityRelations:
    """Tests for topic entity relations endpoints."""

    async def test_add_topic_to_topic_relation(
        self,
        test_client: AsyncClient,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should create a relation from one topic to another."""
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        response = await test_client.post(
            f"/topics/{topic1.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": topic2.id},
        )

        assert response.status_code == 200

        # Verify relation exists by querying the database directly
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == topic1.id,
                EntityRelation.to_topic_id == topic2.id,
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is not None

    async def test_add_source_to_topic_relation(
        self,
        test_client: AsyncClient,
        create_test_topic,
        create_test_source,
        db_session: AsyncSession,
    ):
        """Should create a relation from topic to source."""
        topic = await create_test_topic(name="Topic")
        source = await create_test_source(title="Source")

        response = await test_client.post(
            f"/topics/{topic.id}/entity-relations/",
            json={"to_entity_type": "source", "to_entity_id": source.id},
        )

        assert response.status_code == 200

        # Verify relation exists
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == topic.id,
                EntityRelation.to_source_id == source.id,
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is not None

    async def test_remove_topic_entity_relation(
        self,
        test_client: AsyncClient,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should remove a topic-to-topic relation."""
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        # Create relation
        await test_client.post(
            f"/topics/{topic1.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": topic2.id},
        )

        # Delete relation
        response = await test_client.delete(
            f"/topics/{topic1.id}/entity-relations/topic/{topic2.id}/"
        )
        assert response.status_code == 200

        # Verify relation removed
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == topic1.id,
                EntityRelation.to_topic_id == topic2.id,
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is None

    async def test_cannot_relate_topic_to_self(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should reject self-referencing topic relations."""
        topic = await create_test_topic(name="Topic")

        response = await test_client.post(
            f"/topics/{topic.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": topic.id},
        )

        assert response.status_code == 400

    async def test_topic_relation_not_found(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should return 404 when relation doesn't exist."""
        topic = await create_test_topic(name="Topic")

        response = await test_client.delete(
            f"/topics/{topic.id}/entity-relations/topic/99999/"
        )

        assert response.status_code == 404


class TestSourceEntityRelations:
    """Tests for source entity relations endpoints."""

    async def test_add_topic_to_source_relation(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should create a relation from source to topic."""
        source = await create_test_source(title="Source")
        topic = await create_test_topic(name="Topic")

        response = await test_client.post(
            f"/sources/{source.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": topic.id},
        )

        assert response.status_code == 200

        # Verify relation exists
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_source_id == source.id,
                EntityRelation.to_topic_id == topic.id,
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is not None

    async def test_add_source_to_source_relation(
        self,
        test_client: AsyncClient,
        create_test_source,
        db_session: AsyncSession,
    ):
        """Should create a relation from one source to another."""
        source1 = await create_test_source(title="Source 1")
        source2 = await create_test_source(title="Source 2")

        response = await test_client.post(
            f"/sources/{source1.id}/entity-relations/",
            json={"to_entity_type": "source", "to_entity_id": source2.id},
        )

        assert response.status_code == 200

        # Verify relation exists
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_source_id == source1.id,
                EntityRelation.to_source_id == source2.id,
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is not None

    async def test_remove_source_entity_relation(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should remove a source-to-topic relation."""
        source = await create_test_source(title="Source")
        topic = await create_test_topic(name="Topic")

        # Create relation
        await test_client.post(
            f"/sources/{source.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": topic.id},
        )

        # Delete relation
        response = await test_client.delete(
            f"/sources/{source.id}/entity-relations/topic/{topic.id}/"
        )
        assert response.status_code == 200

        # Verify relation removed
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_source_id == source.id,
                EntityRelation.to_topic_id == topic.id,
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is None

    async def test_cannot_relate_source_to_self(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should reject self-referencing source relations."""
        source = await create_test_source(title="Source")

        response = await test_client.post(
            f"/sources/{source.id}/entity-relations/",
            json={"to_entity_type": "source", "to_entity_id": source.id},
        )

        assert response.status_code == 400


class TestSourcePrerequisites:
    """Tests for source prerequisites endpoints."""

    async def test_add_topic_prerequisite(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should add a topic as prerequisite for a source."""
        source = await create_test_source(title="Advanced Source")
        topic = await create_test_topic(name="Prerequisite Topic")

        response = await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": topic.id},
        )

        assert response.status_code == 200

        # Verify prerequisite exists
        result = await db_session.execute(
            select(SourcePrerequisite).where(
                SourcePrerequisite.source_id == source.id,
                SourcePrerequisite.prereq_topic_id == topic.id,
            )
        )
        prereq = result.scalar_one_or_none()
        assert prereq is not None

    async def test_add_source_prerequisite(
        self,
        test_client: AsyncClient,
        create_test_source,
        db_session: AsyncSession,
    ):
        """Should add a source as prerequisite for another source."""
        advanced_source = await create_test_source(title="Advanced Source")
        prereq_source = await create_test_source(title="Prerequisite Source")

        response = await test_client.post(
            f"/sources/{advanced_source.id}/prerequisites/",
            json={"prereq_entity_type": "source", "prereq_entity_id": prereq_source.id},
        )

        assert response.status_code == 200

        # Verify prerequisite exists
        result = await db_session.execute(
            select(SourcePrerequisite).where(
                SourcePrerequisite.source_id == advanced_source.id,
                SourcePrerequisite.prereq_source_id == prereq_source.id,
            )
        )
        prereq = result.scalar_one_or_none()
        assert prereq is not None

    async def test_get_source_prerequisites(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
    ):
        """Should list all prerequisites for a source."""
        source = await create_test_source(title="Advanced Source")
        topic = await create_test_topic(name="Prereq Topic")
        prereq_source = await create_test_source(title="Prereq Source")

        # Add topic prerequisite
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": topic.id},
        )
        # Add source prerequisite
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "source", "prereq_entity_id": prereq_source.id},
        )

        response = await test_client.get(f"/sources/{source.id}/prerequisites/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    async def test_remove_prerequisite(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should remove a prerequisite from a source."""
        source = await create_test_source(title="Source")
        topic = await create_test_topic(name="Prereq Topic")

        # Add prerequisite
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": topic.id},
        )

        # Remove prerequisite
        response = await test_client.delete(
            f"/sources/{source.id}/prerequisites/topic/{topic.id}/"
        )
        assert response.status_code == 200

        # Verify removed
        result = await db_session.execute(
            select(SourcePrerequisite).where(
                SourcePrerequisite.source_id == source.id,
                SourcePrerequisite.prereq_topic_id == topic.id,
            )
        )
        prereq = result.scalar_one_or_none()
        assert prereq is None

    async def test_cannot_add_self_as_prerequisite(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should reject adding a source as its own prerequisite."""
        source = await create_test_source(title="Source")

        response = await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "source", "prereq_entity_id": source.id},
        )

        assert response.status_code == 400

    async def test_prerequisite_not_found(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should return 404 when prerequisite doesn't exist."""
        source = await create_test_source(title="Source")

        response = await test_client.delete(
            f"/sources/{source.id}/prerequisites/topic/99999/"
        )

        assert response.status_code == 404
