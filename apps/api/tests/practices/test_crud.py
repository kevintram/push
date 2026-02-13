"""Integration tests for practices endpoints."""

from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Source, Topic


class TestPracticesEndpoints:
    """Integration tests for /practices endpoints."""

    async def test_list_practices_returns_empty_for_new_user(
        self,
        test_client: AsyncClient,
    ):
        """New user should have no practices."""
        response = await test_client.get("/practices/")

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_practices_returns_user_practices(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should return practices for the authenticated user."""
        await create_test_practice(prompt="My Test Practice")
        await create_test_practice(user_id="other-user", prompt="Other User Practice")

        response = await test_client.get("/practices/")

        assert response.status_code == 200
        practices = response.json()
        assert len(practices) == 1
        assert practices[0]["prompt"] == "My Test Practice"
        assert practices[0]["last_review_rating"] is None

    async def test_create_practice_success(
        self,
        test_client: AsyncClient,
    ):
        """Should create a new practice."""
        response = await test_client.post(
            "/practices/",
            json={
                "prompt": "What is the capital of France?",
                "answer": "Paris",
                "srs_enabled": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["prompt"] == "What is the capital of France?"
        assert data["answer"] == "Paris"
        assert data["id"] is not None

    async def test_get_practice_by_id(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should return a specific practice by ID."""
        practice = await create_test_practice(prompt="Specific Practice")

        response = await test_client.get(f"/practices/{practice.id}/")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == practice.id
        assert data["prompt"] == "Specific Practice"

    async def test_get_practice_not_found(
        self,
        test_client: AsyncClient,
    ):
        """Should return 404 for non-existent practice."""
        response = await test_client.get("/practices/99999/")

        assert response.status_code == 404

    async def test_delete_practice_success(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should delete a practice."""
        practice = await create_test_practice(prompt="Practice to Delete")

        response = await test_client.delete(f"/practices/{practice.id}/")
        assert response.status_code == 204

        # Verify practice is gone via API
        get_response = await test_client.get(f"/practices/{practice.id}/")
        assert get_response.status_code == 404


class TestCrossEntityInheritFsrs:
    """Tests for inherit_fsrs when creating cross-entity relationships from practices."""

    async def test_practice_to_topic_inherit_fsrs(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_practice,
    ):
        practice = await create_test_practice(
            prompt="Practice Topic Parent",
            initial_stability=2.4,
            initial_difficulty=3.0,
            initial_state="REVIEW",
            initial_step=1,
        )

        response = await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={
                "topic": {
                    "name": "Inherited Topic From Practice",
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
            practice.fsrs_state.stability
        )
        assert topic.fsrs_state.inherited_difficulty == pytest.approx(
            practice.fsrs_state.difficulty
        )
        assert topic.fsrs_state.inherited_state == practice.fsrs_state.state

    async def test_practice_to_source_inherit_fsrs(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_practice,
    ):
        practice = await create_test_practice(
            prompt="Practice Source Parent",
            initial_stability=1.9,
            initial_difficulty=2.6,
            initial_state="REVIEW",
            initial_step=2,
        )

        response = await test_client.post(
            f"/practices/{practice.id}/sources/",
            json={
                "source": {
                    "title": "Inherited Source From Practice",
                    "notes": "",
                    "archived": False,
                    "inboxed": False,
                    "srs_enabled": False,
                    "inherit_fsrs": True,
                }
            },
        )

        assert response.status_code == 200
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
            practice.fsrs_state.stability
        )
        assert source.fsrs_state.inherited_difficulty == pytest.approx(
            practice.fsrs_state.difficulty
        )
        assert source.fsrs_state.inherited_state == practice.fsrs_state.state

    async def test_update_practice_success(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should update a practice."""
        practice = await create_test_practice(prompt="Original Prompt")

        response = await test_client.patch(
            f"/practices/{practice.id}/",
            json={"prompt": "Updated Prompt"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["prompt"] == "Updated Prompt"

    async def test_search_practices(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should search practices by prompt/answer."""
        await create_test_practice(
            prompt="What is Python?", answer="A programming language"
        )
        await create_test_practice(
            prompt="What is Java?", answer="Another programming language"
        )
        await create_test_practice(prompt="Capital of France?", answer="Paris")

        response = await test_client.get(
            "/practices/search/", params={"query": "Python"}
        )

        assert response.status_code == 200
        practices = response.json()
        assert len(practices) == 1
        assert "Python" in practices[0]["prompt"]

    async def test_list_practices_with_filters(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should filter practices by inboxed/archived status."""
        await create_test_practice(prompt="Inboxed Practice", inboxed=True)
        await create_test_practice(prompt="Archived Practice", archived=True)
        await create_test_practice(prompt="Normal Practice")

        # Filter by inboxed
        response = await test_client.get("/practices/", params={"inboxed": True})
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["prompt"] == "Inboxed Practice"

        # Filter by archived
        response = await test_client.get("/practices/", params={"archived": True})
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["prompt"] == "Archived Practice"


class TestPracticeTopicAssociations:
    """Tests for practice-topic associations."""

    async def test_add_topic_to_practice(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
    ):
        """Should add a topic to a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        topic = await create_test_topic(name="Test Topic")

        response = await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic.id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["practice"]["id"] == practice.id
        assert data["topic"]["id"] == topic.id

    async def test_get_practice_topics(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
    ):
        """Should list topics associated with a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        # Add topics
        await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic1.id},
        )
        await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic2.id},
        )

        response = await test_client.get(f"/practices/{practice.id}/topics/")

        assert response.status_code == 200
        topics = response.json()
        assert len(topics) == 2
        topic_ids = {t["id"] for t in topics}
        assert topic1.id in topic_ids
        assert topic2.id in topic_ids

    async def test_remove_topic_from_practice(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
    ):
        """Should remove a topic from a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        topic = await create_test_topic(name="Test Topic")

        # Add and then remove
        await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic.id},
        )
        response = await test_client.delete(
            f"/practices/{practice.id}/topics/{topic.id}/"
        )

        assert response.status_code == 204

        # Verify removed
        get_response = await test_client.get(f"/practices/{practice.id}/topics/")
        assert get_response.status_code == 200
        assert len(get_response.json()) == 0

    async def test_add_topic_to_practice_inline_create(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should create a new topic inline and add it to the practice."""
        practice = await create_test_practice(prompt="Test Practice")

        response = await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic": {"name": "Inline Topic"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["practice"]["id"] == practice.id
        assert data["topic"]["name"] == "Inline Topic"
        assert data["topic"]["id"] is not None

    async def test_add_duplicate_topic_fails(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
    ):
        """Should fail when adding the same topic twice."""
        practice = await create_test_practice(prompt="Test Practice")
        topic = await create_test_topic(name="Test Topic")

        # Add topic first time
        await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic.id},
        )

        # Add topic second time should fail
        response = await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic.id},
        )

        assert response.status_code == 409


class TestPracticeSourceAssociations:
    """Tests for practice-source associations."""

    async def test_add_source_to_practice(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_source,
    ):
        """Should add a source to a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        source = await create_test_source(title="Test Source")

        response = await test_client.post(
            f"/practices/{practice.id}/sources/",
            json={"source_id": source.id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["practice"]["id"] == practice.id
        assert data["source"]["id"] == source.id

    async def test_add_source_to_practice_inline_create(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should create a new source inline and add it to the practice."""
        practice = await create_test_practice(prompt="Test Practice")

        response = await test_client.post(
            f"/practices/{practice.id}/sources/",
            json={"source": {"title": "Inline Source"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["practice"]["id"] == practice.id
        assert data["source"]["title"] == "Inline Source"
        assert data["source"]["id"] is not None

    async def test_get_practice_sources(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_source,
    ):
        """Should list sources associated with a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        source1 = await create_test_source(title="Source 1")
        source2 = await create_test_source(title="Source 2")

        # Add sources
        await test_client.post(
            f"/practices/{practice.id}/sources/",
            json={"source_id": source1.id},
        )
        await test_client.post(
            f"/practices/{practice.id}/sources/",
            json={"source_id": source2.id},
        )

        response = await test_client.get(f"/practices/{practice.id}/sources/")

        assert response.status_code == 200
        sources = response.json()
        assert len(sources) == 2
        source_ids = {s["id"] for s in sources}
        assert source1.id in source_ids
        assert source2.id in source_ids

    async def test_remove_source_from_practice(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_source,
    ):
        """Should remove a source from a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        source = await create_test_source(title="Test Source")

        # Add and then remove
        await test_client.post(
            f"/practices/{practice.id}/sources/",
            json={"source_id": source.id},
        )
        response = await test_client.delete(
            f"/practices/{practice.id}/sources/{source.id}/"
        )

        assert response.status_code == 204

        # Verify removed
        get_response = await test_client.get(f"/practices/{practice.id}/sources/")
        assert get_response.status_code == 200
        assert len(get_response.json()) == 0


class TestPracticeAssociationEndpointsIncludeParent:
    async def test_practice_association_endpoints_include_parent(
        self,
        test_client: AsyncClient,
        create_test_topic,
        create_test_source,
        create_test_practice,
    ):
        topic_parent = await create_test_topic(name="Topic Parent")
        topic_child = await create_test_topic(
            name="Topic Child", parent_id=topic_parent.id
        )
        source_parent = await create_test_source(title="Source Parent")
        source_child = await create_test_source(
            title="Source Child", parent_id=source_parent.id
        )
        practice = await create_test_practice(prompt="Practice")

        add_topic = await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic_child.id},
        )
        assert add_topic.status_code == 200
        assert add_topic.json()["topic"]["parent"]["id"] == topic_parent.id

        add_source = await test_client.post(
            f"/practices/{practice.id}/sources/",
            json={"source_id": source_child.id},
        )
        assert add_source.status_code == 200
        assert add_source.json()["source"]["parent"]["id"] == source_parent.id

        list_topics = await test_client.get(f"/practices/{practice.id}/topics/")
        assert list_topics.status_code == 200
        assert list_topics.json()[0]["parent"]["id"] == topic_parent.id

        list_sources = await test_client.get(f"/practices/{practice.id}/sources/")
        assert list_sources.status_code == 200
        assert list_sources.json()[0]["parent"]["id"] == source_parent.id

        detail = await test_client.get(f"/practices/{practice.id}/")
        assert detail.status_code == 200
        detail_payload = detail.json()
        assert detail_payload["topics"][0]["parent"]["id"] == topic_parent.id
        assert detail_payload["sources"][0]["parent"]["id"] == source_parent.id


class TestPracticeReviews:
    """Tests for practice reviews."""

    async def test_create_practice_review(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should create a review for a practice."""
        practice = await create_test_practice(prompt="Test Practice")

        response = await test_client.post(
            "/reviews/",
            json={
                "practice_id": practice.id,
                "scheduled_at": str(date.today()),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["practice"]["id"] == practice.id

    async def test_create_practice_with_inline_review(
        self,
        test_client: AsyncClient,
    ):
        """Should create a review with inline practice creation."""
        response = await test_client.post(
            "/reviews/",
            json={
                "practice": {
                    "prompt": "New Practice",
                    "answer": "New Answer",
                    "srs_enabled": True,
                },
                "scheduled_at": str(date.today()),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["practice"]["prompt"] == "New Practice"
        assert data["practice"]["answer"] == "New Answer"

    async def test_complete_practice_review_updates_fsrs(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Completing a practice review should update FSRS state."""
        practice = await create_test_practice(prompt="Test Practice")

        response = await test_client.post(
            "/reviews/",
            json={
                "practice_id": practice.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["stability_after"] is not None
        assert data["difficulty_after"] is not None
