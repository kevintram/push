"""Integration tests for topic + review-card search endpoint."""

from httpx import AsyncClient


async def _create_topic(test_client: AsyncClient, title: str) -> dict:
    response = await test_client.post(
        "/topics/",
        json={"title": title, "body": "Body"},
    )
    assert response.status_code == 201
    return response.json()


async def _create_review_card(
    test_client: AsyncClient,
    topic_id: int,
    *,
    card_type: str,
    prompt: str,
    answer: str = "Answer",
) -> dict:
    response = await test_client.post(
        "/review-cards/",
        json={
            "topic_id": topic_id,
            "type": card_type,
            "prompt": prompt,
            "answer": answer,
            "srs_enabled": True,
        },
    )
    assert response.status_code == 201
    return response.json()


class TestSearchEndpoint:
    async def test_search_topic_filter_returns_topic_entities(
        self,
        test_client: AsyncClient,
    ):
        rust_topic = await _create_topic(test_client, "Rust Ownership")
        _ = await _create_topic(test_client, "React Rendering")

        response = await test_client.get("/search/?query=rust&entity_types=topic")

        assert response.status_code == 200
        results = response.json()
        assert len(results) == 1
        assert results[0]["entity_type"] == "topic"
        assert results[0]["topic"]["id"] == rust_topic["id"]
        assert results[0]["review_card"] is None

    async def test_search_review_card_filter_returns_review_card_entities(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Card topic")
        practice_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Queue practice prompt",
        )
        _ = await _create_review_card(
            test_client,
            topic["id"],
            card_type="flashcard",
            prompt="Rust flashcard prompt",
        )

        response = await test_client.get(
            "/search/?query=queue&entity_types=review_card"
        )

        assert response.status_code == 200
        results = response.json()
        assert len(results) >= 1
        assert all(item["entity_type"] == "review_card" for item in results)
        ids = {item["review_card"]["id"] for item in results if item["review_card"]}
        assert practice_card["id"] in ids

    async def test_search_practice_filter_limits_card_type(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Practice filter")
        practice_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Binary trees practice",
        )
        flashcard = await _create_review_card(
            test_client,
            topic["id"],
            card_type="flashcard",
            prompt="Binary trees flashcard",
        )

        response = await test_client.get("/search/?query=binary&entity_types=practice")

        assert response.status_code == 200
        results = response.json()
        ids = {item["review_card"]["id"] for item in results if item["review_card"]}
        assert practice_card["id"] in ids
        assert flashcard["id"] not in ids
