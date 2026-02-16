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

    async def test_add_topic_relation_inline_create(
        self,
        test_client: AsyncClient,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should create a topic inline and relate it to an existing topic."""
        topic = await create_test_topic(name="From Topic")

        response = await test_client.post(
            f"/topics/{topic.id}/entity-relations/",
            json={
                "to_entity_type": "topic",
                "to_topic": {"name": "Inline Related Topic"},
            },
        )

        assert response.status_code == 200

        # Verify relation exists with newly created topic
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == topic.id,
                EntityRelation.to_topic_id.isnot(None),
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is not None

    async def test_add_source_relation_to_topic_inline_create(
        self,
        test_client: AsyncClient,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should create a source inline and relate it to an existing topic."""
        topic = await create_test_topic(name="Topic")

        response = await test_client.post(
            f"/topics/{topic.id}/entity-relations/",
            json={
                "to_entity_type": "source",
                "to_source": {"title": "Inline Related Source"},
            },
        )

        assert response.status_code == 200

        # Verify relation exists with newly created source
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == topic.id,
                EntityRelation.to_source_id.isnot(None),
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is not None

    async def test_remove_incoming_topic_relation(
        self,
        test_client: AsyncClient,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should remove a topic relation created in the reverse direction."""
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        # Create relation from topic2 -> topic1
        await test_client.post(
            f"/topics/{topic2.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": topic1.id},
        )

        # Delete from topic1's side (incoming relation)
        response = await test_client.delete(
            f"/topics/{topic1.id}/entity-relations/topic/{topic2.id}/"
        )
        assert response.status_code == 200

        # Verify relation removed
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == topic2.id,
                EntityRelation.to_topic_id == topic1.id,
            )
        )
        assert result.scalar_one_or_none() is None

    async def test_remove_incoming_source_relation_from_topic(
        self,
        test_client: AsyncClient,
        create_test_topic,
        create_test_source,
        db_session: AsyncSession,
    ):
        """Should remove a source relation that was created from the source side."""
        topic = await create_test_topic(name="Topic")
        source = await create_test_source(title="Source")

        # Create relation from source -> topic (reverse direction)
        await test_client.post(
            f"/sources/{source.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": topic.id},
        )

        # Delete from topic's side (incoming relation)
        response = await test_client.delete(
            f"/topics/{topic.id}/entity-relations/source/{source.id}/"
        )
        assert response.status_code == 200

        # Verify relation removed
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_source_id == source.id,
                EntityRelation.to_topic_id == topic.id,
            )
        )
        assert result.scalar_one_or_none() is None

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

    async def test_remove_incoming_topic_relation_from_source(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
        db_session: AsyncSession,
    ):
        """Should remove a topic relation that was created from the topic side."""
        source = await create_test_source(title="Source")
        topic = await create_test_topic(name="Topic")

        # Create relation from topic -> source (reverse direction for source)
        await test_client.post(
            f"/topics/{topic.id}/entity-relations/",
            json={"to_entity_type": "source", "to_entity_id": source.id},
        )

        # Delete from source's side (incoming relation)
        response = await test_client.delete(
            f"/sources/{source.id}/entity-relations/topic/{topic.id}/"
        )
        assert response.status_code == 200

        # Verify relation removed
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_topic_id == topic.id,
                EntityRelation.to_source_id == source.id,
            )
        )
        assert result.scalar_one_or_none() is None

    async def test_remove_incoming_source_relation_from_source(
        self,
        test_client: AsyncClient,
        create_test_source,
        db_session: AsyncSession,
    ):
        """Should remove a source relation created in the reverse direction."""
        source1 = await create_test_source(title="Source 1")
        source2 = await create_test_source(title="Source 2")

        # Create relation from source2 -> source1
        await test_client.post(
            f"/sources/{source2.id}/entity-relations/",
            json={"to_entity_type": "source", "to_entity_id": source1.id},
        )

        # Delete from source1's side (incoming relation)
        response = await test_client.delete(
            f"/sources/{source1.id}/entity-relations/source/{source2.id}/"
        )
        assert response.status_code == 200

        # Verify relation removed
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_source_id == source2.id,
                EntityRelation.to_source_id == source1.id,
            )
        )
        assert result.scalar_one_or_none() is None

    async def test_add_topic_relation_to_source_inline_create(
        self,
        test_client: AsyncClient,
        create_test_source,
        db_session: AsyncSession,
    ):
        """Should create a topic inline and relate it to an existing source."""
        source = await create_test_source(title="Source")

        response = await test_client.post(
            f"/sources/{source.id}/entity-relations/",
            json={
                "to_entity_type": "topic",
                "to_topic": {"name": "Inline Related Topic"},
            },
        )

        assert response.status_code == 200

        # Verify relation exists with newly created topic
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_source_id == source.id,
                EntityRelation.to_topic_id.isnot(None),
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is not None

    async def test_add_source_relation_to_source_inline_create(
        self,
        test_client: AsyncClient,
        create_test_source,
        db_session: AsyncSession,
    ):
        """Should create a source inline and relate it to an existing source."""
        source = await create_test_source(title="From Source")

        response = await test_client.post(
            f"/sources/{source.id}/entity-relations/",
            json={
                "to_entity_type": "source",
                "to_source": {"title": "Inline Related Source"},
            },
        )

        assert response.status_code == 200

        # Verify relation exists with newly created source
        result = await db_session.execute(
            select(EntityRelation).where(
                EntityRelation.from_source_id == source.id,
                EntityRelation.to_source_id.isnot(None),
            )
        )
        relation = result.scalar_one_or_none()
        assert relation is not None

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

    async def test_add_prerequisite_inline_create(
        self,
        test_client: AsyncClient,
        create_test_source,
        db_session: AsyncSession,
    ):
        """Should create a source inline and add it as a prerequisite."""
        source = await create_test_source(title="Advanced Source")

        response = await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={
                "prereq_entity_type": "source",
                "prereq_source": {"title": "Inline Prerequisite"},
            },
        )

        assert response.status_code == 200

        # Verify prerequisite exists with newly created source
        result = await db_session.execute(
            select(SourcePrerequisite).where(
                SourcePrerequisite.source_id == source.id,
                SourcePrerequisite.prereq_source_id.isnot(None),
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

    async def test_entity_relation_and_prerequisite_endpoints_include_parent(
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

        root_topic = await create_test_topic(name="Root Topic")
        root_source = await create_test_source(title="Root Source")

        rel_topic_to_topic = await test_client.post(
            f"/topics/{root_topic.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": topic_child.id},
        )
        assert rel_topic_to_topic.status_code == 200

        rel_topic_to_source = await test_client.post(
            f"/topics/{root_topic.id}/entity-relations/",
            json={"to_entity_type": "source", "to_entity_id": source_child.id},
        )
        assert rel_topic_to_source.status_code == 200

        topic_relations = await test_client.get(
            f"/topics/{root_topic.id}/entity-relations/"
        )
        assert topic_relations.status_code == 200
        topic_outgoing = topic_relations.json()["outgoing"]
        outgoing_topic = next(
            item for item in topic_outgoing if item["entity_type"] == "topic"
        )
        outgoing_source = next(
            item for item in topic_outgoing if item["entity_type"] == "source"
        )
        assert outgoing_topic["parent"]["id"] == topic_parent.id
        assert outgoing_source["parent"]["id"] == source_parent.id

        rel_source_to_topic = await test_client.post(
            f"/sources/{root_source.id}/entity-relations/",
            json={"to_entity_type": "topic", "to_entity_id": topic_child.id},
        )
        assert rel_source_to_topic.status_code == 200

        rel_source_to_source = await test_client.post(
            f"/sources/{root_source.id}/entity-relations/",
            json={"to_entity_type": "source", "to_entity_id": source_child.id},
        )
        assert rel_source_to_source.status_code == 200

        source_relations = await test_client.get(
            f"/sources/{root_source.id}/entity-relations/"
        )
        assert source_relations.status_code == 200
        source_outgoing = source_relations.json()["outgoing"]
        outgoing_topic = next(
            item for item in source_outgoing if item["entity_type"] == "topic"
        )
        outgoing_source = next(
            item for item in source_outgoing if item["entity_type"] == "source"
        )
        assert outgoing_topic["parent"]["id"] == topic_parent.id
        assert outgoing_source["parent"]["id"] == source_parent.id

        add_topic_prereq = await test_client.post(
            f"/sources/{root_source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": topic_child.id},
        )
        assert add_topic_prereq.status_code == 200

        add_source_prereq = await test_client.post(
            f"/sources/{root_source.id}/prerequisites/",
            json={"prereq_entity_type": "source", "prereq_entity_id": source_child.id},
        )
        assert add_source_prereq.status_code == 200

        prerequisites = await test_client.get(
            f"/sources/{root_source.id}/prerequisites/"
        )
        assert prerequisites.status_code == 200
        prereq_topic = next(
            item for item in prerequisites.json() if item["entity_type"] == "topic"
        )
        prereq_source = next(
            item for item in prerequisites.json() if item["entity_type"] == "source"
        )
        assert prereq_topic["parent"]["id"] == topic_parent.id
        assert prereq_source["parent"]["id"] == source_parent.id

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
