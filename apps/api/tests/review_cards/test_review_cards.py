"""Integration tests for review-card endpoints."""

from httpx import AsyncClient


async def _create_topic(test_client: AsyncClient, title: str = "Topic") -> dict:
    response = await test_client.post(
        "/topics/",
        json={"title": title, "body": ""},
    )
    assert response.status_code == 201
    return response.json()


class TestReviewCardEndpoints:
    async def test_create_review_card_returns_retired_and_omits_legacy_fields(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Review cards")

        response = await test_client.post(
            "/review-cards/",
            json={
                "topic_id": topic["id"],
                "type": "flashcard",
                "prompt": "Prompt",
                "answer": "Answer",
            },
        )

        assert response.status_code == 201
        payload = response.json()
        assert payload["retired"] is False
        assert "srs_enabled" not in payload
        assert "fsrs_state_id" not in payload

    async def test_update_review_card_can_toggle_retired(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Retired toggle")
        create_response = await test_client.post(
            "/review-cards/",
            json={
                "topic_id": topic["id"],
                "type": "practice",
                "prompt": "Prompt",
                "answer": "Answer",
            },
        )
        assert create_response.status_code == 201
        review_card = create_response.json()

        update_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"retired": True},
        )

        assert update_response.status_code == 200
        payload = update_response.json()
        assert payload["retired"] is True
        assert "srs_enabled" not in payload

    async def test_create_review_card_rejects_legacy_srs_enabled_field(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Legacy")

        response = await test_client.post(
            "/review-cards/",
            json={
                "topic_id": topic["id"],
                "type": "flashcard",
                "prompt": "Prompt",
                "answer": "Answer",
                "srs_enabled": True,
            },
        )

        assert response.status_code == 422
