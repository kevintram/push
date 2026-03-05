"""Integration tests for topic deletion behavior."""

from datetime import date

from httpx import AsyncClient


async def _create_topic(
    test_client: AsyncClient,
    *,
    title: str,
    parent_id: int | None = None,
) -> dict:
    payload: dict[str, int | str | None] = {"title": title, "body": ""}
    if parent_id is not None:
        payload["parent_id"] = parent_id

    response = await test_client.post("/topics/", json=payload)
    assert response.status_code == 201
    return response.json()


async def _create_review_card(
    test_client: AsyncClient,
    *,
    topic_id: int,
    prompt: str,
) -> dict:
    response = await test_client.post(
        "/review-cards/",
        json={
            "topic_id": topic_id,
            "type": "practice",
            "prompt": prompt,
            "answer": "answer",
            "retired": False,
        },
    )
    assert response.status_code == 201
    return response.json()


async def _create_completed_review(
    test_client: AsyncClient,
    *,
    review_card_id: int,
) -> dict:
    response = await test_client.post(
        "/reviews/",
        json={
            "review_card_id": review_card_id,
            "completed_at": str(date.today()),
            "rating": "good",
        },
    )
    assert response.status_code == 200
    return response.json()


class TestTopicDelete:
    async def test_delete_topic_cascades_to_subtopics_and_review_data(
        self,
        test_client: AsyncClient,
    ):
        root = await _create_topic(test_client, title="Root")
        child = await _create_topic(
            test_client,
            title="Child",
            parent_id=root["id"],
        )
        grandchild = await _create_topic(
            test_client,
            title="Grandchild",
            parent_id=child["id"],
        )

        root_card = await _create_review_card(
            test_client,
            topic_id=root["id"],
            prompt="root card",
        )
        child_card = await _create_review_card(
            test_client,
            topic_id=child["id"],
            prompt="child card",
        )
        _ = await _create_review_card(
            test_client,
            topic_id=grandchild["id"],
            prompt="grandchild card",
        )
        _ = await _create_completed_review(
            test_client,
            review_card_id=child_card["id"],
        )

        delete_response = await test_client.delete(f"/topics/{root['id']}/")
        assert delete_response.status_code == 204

        for topic_id in (root["id"], child["id"], grandchild["id"]):
            topic_response = await test_client.get(f"/topics/{topic_id}/")
            assert topic_response.status_code == 404

        for review_card_id in (root_card["id"], child_card["id"]):
            review_card_response = await test_client.get(
                f"/review-cards/{review_card_id}/"
            )
            assert review_card_response.status_code == 404

        reviews_response = await test_client.get(
            f"/reviews/?review_card_id={child_card['id']}"
        )
        assert reviews_response.status_code == 200
        assert reviews_response.json() == []

    async def test_delete_leaf_topic_still_cascades_review_cards(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, title="Leaf")
        card = await _create_review_card(
            test_client,
            topic_id=topic["id"],
            prompt="leaf card",
        )
        _ = await _create_completed_review(
            test_client,
            review_card_id=card["id"],
        )

        delete_response = await test_client.delete(f"/topics/{topic['id']}/")
        assert delete_response.status_code == 204

        review_card_response = await test_client.get(f"/review-cards/{card['id']}/")
        assert review_card_response.status_code == 404

        reviews_response = await test_client.get(
            f"/reviews/?review_card_id={card['id']}"
        )
        assert reviews_response.status_code == 200
        assert reviews_response.json() == []
