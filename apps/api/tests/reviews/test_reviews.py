"""Integration tests for review-card based reviews endpoints."""

from datetime import date, timedelta

from httpx import AsyncClient


async def _create_topic(test_client: AsyncClient, title: str = "Topic") -> dict:
    response = await test_client.post(
        "/topics/",
        json={"title": title, "body": ""},
    )
    assert response.status_code == 201
    return response.json()


async def _create_review_card(
    test_client: AsyncClient,
    topic_id: int,
    *,
    card_type: str = "practice",
    primary_text: str = "Prompt",
) -> dict:
    response = await test_client.post(
        "/review-cards/",
        json={
            "topic_id": topic_id,
            "type": card_type,
            "primary_text": primary_text,
            "secondary_text": "Answer",
            "retired": False,
        },
    )
    assert response.status_code == 201
    return response.json()


class TestReviewsEndpoints:
    async def test_create_uncompleted_review_does_not_compute_fsrs(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Uncompleted")
        review_card = await _create_review_card(test_client, topic["id"])

        response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": review_card["id"],
                "scheduled_at": str(date.today()),
            },
        )

        assert response.status_code == 200
        review = response.json()
        assert review["review_card_id"] == review_card["id"]
        assert review["completed_at"] is None
        assert review["rating"] is None
        assert review["stability_before"] is None
        assert review["stability_after"] is None

    async def test_create_completed_review_and_filter_by_review_card_id(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Completed")
        review_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="flashcard",
            primary_text="Completed card",
        )

        create_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": review_card["id"],
                "completed_at": str(date.today()),
                "rating": "good",
                "description": "First completed review",
                "notes": "Created with notes payload",
            },
        )
        assert create_response.status_code == 200
        created = create_response.json()
        assert created["review_card_id"] == review_card["id"]
        assert created["stability_after"] is not None
        assert created["notes"] == "Created with notes payload"
        assert created["review_card"]["primary_text"] == "Completed card"

        list_response = await test_client.get(
            f"/reviews/?review_card_id={review_card['id']}"
        )
        assert list_response.status_code == 200

        items = list_response.json()
        assert len(items) == 1
        assert items[0]["review_card_id"] == review_card["id"]
        assert items[0]["review_card"]["id"] == review_card["id"]
        assert items[0]["review_card"]["type"] == "flashcard"

    async def test_descending_order_places_reviews_without_dates_first(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Review ordering")
        review_card = await _create_review_card(test_client, topic["id"])

        dated_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": review_card["id"],
                "scheduled_at": str(date.today()),
                "description": "Dated",
            },
        )
        first_undated_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": review_card["id"],
                "description": "First undated",
            },
        )
        second_undated_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": review_card["id"],
                "description": "Second undated",
            },
        )

        assert dated_response.status_code == 200
        assert first_undated_response.status_code == 200
        assert second_undated_response.status_code == 200

        response = await test_client.get(
            f"/reviews/?review_card_id={review_card['id']}&order=desc"
        )

        assert response.status_code == 200
        assert [review["description"] for review in response.json()] == [
            "Second undated",
            "First undated",
            "Dated",
        ]

    async def test_nested_review_card_create_endpoint_delegates_to_reviews_flow(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Delegated")
        review_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="flashcard",
            primary_text="Delegated card",
        )

        nested_response = await test_client.post(
            f"/review-cards/{review_card['id']}/reviews/",
            json={
                "completed_at": str(date.today()),
                "rating": "hard",
                "description": "Created through nested endpoint",
            },
        )
        direct_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": review_card["id"],
                "completed_at": str(date.today()),
                "rating": "good",
                "description": "Created through canonical endpoint",
            },
        )

        assert nested_response.status_code == 200
        assert direct_response.status_code == 200

        nested = nested_response.json()
        direct = direct_response.json()

        assert nested["review_card_id"] == review_card["id"]
        assert direct["review_card_id"] == review_card["id"]
        assert nested["review_card"]["id"] == review_card["id"]
        assert direct["review_card"]["id"] == review_card["id"]
        assert nested["stability_after"] is not None
        assert direct["stability_after"] is not None
        assert nested["description"] == "Created through nested endpoint"
        assert direct["description"] == "Created through canonical endpoint"

    async def test_nested_review_card_create_rejects_invalid_rating(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Invalid rating")
        review_card = await _create_review_card(test_client, topic["id"])

        response = await test_client.post(
            f"/review-cards/{review_card['id']}/reviews/",
            json={
                "completed_at": str(date.today()),
                "rating": "invalid-rating",
            },
        )

        assert response.status_code == 422

    async def test_create_completed_review_updates_fsrs_for_retired_card(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Retired review")
        create_card_response = await test_client.post(
            "/review-cards/",
            json={
                "topic_id": topic["id"],
                "type": "flashcard",
                "primary_text": "Retired card",
                "secondary_text": "Answer",
                "retired": True,
            },
        )
        assert create_card_response.status_code == 201
        review_card = create_card_response.json()

        review_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": review_card["id"],
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert review_response.status_code == 200
        payload = review_response.json()
        assert payload["stability_after"] is not None

        review_card_response = await test_client.get(
            f"/review-cards/{review_card['id']}/"
        )
        assert review_card_response.status_code == 200
        refreshed_card = review_card_response.json()
        assert refreshed_card["retired"] is True
        assert refreshed_card["last_reviewed_at"] == str(date.today())

    async def test_update_review_can_reassign_review_card_id(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Reassign")
        first_card = await _create_review_card(
            test_client,
            topic["id"],
            primary_text="First card",
        )
        second_card = await _create_review_card(
            test_client,
            topic["id"],
            primary_text="Second card",
        )

        create_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": first_card["id"],
                "completed_at": str(date.today() - timedelta(days=1)),
                "rating": "good",
            },
        )
        assert create_response.status_code == 200
        review_id = create_response.json()["id"]

        update_response = await test_client.post(
            f"/reviews/{review_id}/",
            json={"review_card_id": second_card["id"]},
        )
        assert update_response.status_code == 200
        assert update_response.json()["review_card_id"] == second_card["id"]

        first_list = await test_client.get(
            f"/reviews/?review_card_id={first_card['id']}"
        )
        second_list = await test_client.get(
            f"/reviews/?review_card_id={second_card['id']}"
        )

        assert first_list.status_code == 200
        assert second_list.status_code == 200
        assert len(first_list.json()) == 0
        assert len(second_list.json()) == 1
        assert second_list.json()[0]["id"] == review_id

    async def test_create_review_with_legacy_field_fails_validation(
        self,
        test_client: AsyncClient,
    ):
        response = await test_client.post(
            "/reviews/",
            json={
                "legacy_id": 123,
                "scheduled_at": str(date.today()),
            },
        )
        assert response.status_code == 422
