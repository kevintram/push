"""Regression tests for review-card deletion."""

from httpx import AsyncClient

from tests.review_cards.test_review_cards import _create_topic


class TestReviewCardDelete:
    async def test_delete_review_card_cascades_reviews_and_type_assignments(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Delete review card")

        create_response = await test_client.post(
            "/review-cards/",
            json={
                "topic_id": topic["id"],
                "type": "practice",
                "primary_text": "Prompt",
                "secondary_text": "Answer",
            },
        )
        assert create_response.status_code == 201
        review_card = create_response.json()

        review_response = await test_client.post(
            f"/review-cards/{review_card['id']}/reviews/",
            json={
                "description": "Completed review",
                "completed_at": "2026-03-06",
                "rating": "good",
            },
        )
        assert review_response.status_code == 200

        delete_response = await test_client.delete(
            f"/review-cards/{review_card['id']}/"
        )

        assert delete_response.status_code == 204

        get_response = await test_client.get(f"/review-cards/{review_card['id']}/")
        assert get_response.status_code == 404
