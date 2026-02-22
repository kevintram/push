"""Integration tests for note relations endpoints."""

from httpx import AsyncClient


class TestNoteRelations:
    async def test_create_list_and_remove_related_relation(
        self,
        test_client: AsyncClient,
    ):
        left_response = await test_client.post(
            "/notes/",
            json={"title": "Left", "body": "", "tags": ["TOPIC"]},
        )
        assert left_response.status_code == 201
        left = left_response.json()

        right_response = await test_client.post(
            "/notes/",
            json={"title": "Right", "body": "", "tags": ["TOPIC"]},
        )
        assert right_response.status_code == 201
        right = right_response.json()

        create_relation = await test_client.post(
            f"/notes/{left['id']}/relations/",
            json={"to_id": right["id"], "relation_type": "RELATED"},
        )
        assert create_relation.status_code == 201
        relation = create_relation.json()
        assert relation["from_id"] == left["id"]
        assert relation["to_id"] == right["id"]

        outgoing = await test_client.get(
            f"/notes/{left['id']}/relations/?direction=outgoing"
        )
        assert outgoing.status_code == 200
        assert len(outgoing.json()) == 1
        assert outgoing.json()[0]["direction"] == "outgoing"

        incoming = await test_client.get(
            f"/notes/{right['id']}/relations/?direction=incoming"
        )
        assert incoming.status_code == 200
        assert len(incoming.json()) == 1
        assert incoming.json()[0]["from_id"] == left["id"]

        remove_relation = await test_client.delete(
            f"/notes/{left['id']}/relations/RELATED/{right['id']}/"
        )
        assert remove_relation.status_code == 204

        outgoing_after = await test_client.get(
            f"/notes/{left['id']}/relations/?direction=outgoing"
        )
        assert outgoing_after.status_code == 200
        assert outgoing_after.json() == []

    async def test_covers_and_assesses_require_expected_tags(
        self,
        test_client: AsyncClient,
    ):
        topic_response = await test_client.post(
            "/notes/",
            json={"title": "Topic", "body": "", "tags": ["TOPIC"]},
        )
        assert topic_response.status_code == 201
        topic = topic_response.json()

        source_response = await test_client.post(
            "/notes/",
            json={"title": "Source", "body": "", "tags": ["SOURCE"]},
        )
        assert source_response.status_code == 201
        source = source_response.json()

        practice_response = await test_client.post(
            "/notes/",
            json={"title": "Practice", "body": "", "tags": ["PRACTICE"]},
        )
        assert practice_response.status_code == 201
        practice = practice_response.json()

        second_source_response = await test_client.post(
            "/notes/",
            json={"title": "Another Source", "body": "", "tags": ["SOURCE"]},
        )
        assert second_source_response.status_code == 201
        second_source = second_source_response.json()

        second_practice_response = await test_client.post(
            "/notes/",
            json={"title": "Another Practice", "body": "", "tags": ["PRACTICE"]},
        )
        assert second_practice_response.status_code == 201
        second_practice = second_practice_response.json()

        covers_response = await test_client.post(
            f"/notes/{source['id']}/relations/",
            json={"to_id": topic["id"], "relation_type": "COVERS"},
        )
        assert covers_response.status_code == 201

        invalid_covers_target = await test_client.post(
            f"/notes/{source['id']}/relations/",
            json={"to_id": second_source["id"], "relation_type": "COVERS"},
        )
        assert invalid_covers_target.status_code == 400
        assert "topic tag" in invalid_covers_target.json()["detail"].lower()

        assesses_response = await test_client.post(
            f"/notes/{practice['id']}/relations/",
            json={"to_id": topic["id"], "relation_type": "ASSESSES"},
        )
        assert assesses_response.status_code == 201

        assesses_source_response = await test_client.post(
            f"/notes/{practice['id']}/relations/",
            json={"to_id": source["id"], "relation_type": "ASSESSES"},
        )
        assert assesses_source_response.status_code == 201

        invalid_assesses_target = await test_client.post(
            f"/notes/{practice['id']}/relations/",
            json={"to_id": second_practice["id"], "relation_type": "ASSESSES"},
        )
        assert invalid_assesses_target.status_code == 400
        assert "topic or source tag" in invalid_assesses_target.json()["detail"].lower()

        invalid_assesses = await test_client.post(
            f"/notes/{topic['id']}/relations/",
            json={"to_id": source["id"], "relation_type": "ASSESSES"},
        )
        assert invalid_assesses.status_code == 400
        assert "practice tag" in invalid_assesses.json()["detail"].lower()

    async def test_cannot_remove_required_tags_when_relations_depend_on_them(
        self,
        test_client: AsyncClient,
    ):
        topic_response = await test_client.post(
            "/notes/",
            json={"title": "Topic", "body": "", "tags": ["TOPIC"]},
        )
        assert topic_response.status_code == 201
        topic = topic_response.json()

        source_response = await test_client.post(
            "/notes/",
            json={"title": "Source", "body": "", "tags": ["SOURCE"]},
        )
        assert source_response.status_code == 201
        source = source_response.json()

        practice_response = await test_client.post(
            "/notes/",
            json={"title": "Practice", "body": "", "tags": ["PRACTICE"]},
        )
        assert practice_response.status_code == 201
        practice = practice_response.json()

        covers_response = await test_client.post(
            f"/notes/{source['id']}/relations/",
            json={"to_id": topic["id"], "relation_type": "COVERS"},
        )
        assert covers_response.status_code == 201

        assesses_response = await test_client.post(
            f"/notes/{practice['id']}/relations/",
            json={"to_id": topic["id"], "relation_type": "ASSESSES"},
        )
        assert assesses_response.status_code == 201

        remove_source_tag = await test_client.delete(
            f"/notes/{source['id']}/tags/SOURCE/"
        )
        assert remove_source_tag.status_code == 400
        assert "relations depend on it" in remove_source_tag.json()["detail"].lower()

        remove_topic_tag = await test_client.delete(f"/notes/{topic['id']}/tags/TOPIC/")
        assert remove_topic_tag.status_code == 400
        assert "relations depend on it" in remove_topic_tag.json()["detail"].lower()

        remove_practice_tag = await test_client.delete(
            f"/notes/{practice['id']}/tags/PRACTICE/"
        )
        assert remove_practice_tag.status_code == 400
        assert "relations depend on it" in remove_practice_tag.json()["detail"].lower()
