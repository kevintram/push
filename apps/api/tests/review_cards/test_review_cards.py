"""Integration tests for review-card endpoints."""

from datetime import datetime, timezone

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_cards import ReviewCard
from app.models.topics import Topic


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
    card_type: str = "flashcard",
    prompt: str = "Prompt",
) -> dict:
    response = await test_client.post(
        "/review-cards/",
        json={
            "topic_id": topic_id,
            "type": card_type,
            "prompt": prompt,
            "answer": "Answer",
        },
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
        assert payload["pinned_at"] is None
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

    async def test_update_review_card_can_toggle_pinned(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Pinned toggle")
        review_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
        )

        update_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"pinned": True},
        )

        assert update_response.status_code == 200
        payload = update_response.json()
        assert payload["pinned_at"] is not None

        unpin_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"pinned": False},
        )

        assert unpin_response.status_code == 200
        assert unpin_response.json()["pinned_at"] is None

    async def test_list_review_cards_orders_pinned_first_and_filters_pinned_only(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Pinned list")
        first_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="First",
        )
        pinned_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Pinned",
        )
        _third_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Third",
        )

        pin_response = await test_client.patch(
            f"/review-cards/{pinned_card['id']}/",
            json={"pinned": True},
        )
        assert pin_response.status_code == 200

        list_response = await test_client.get(f"/review-cards/?topic_id={topic['id']}")
        assert list_response.status_code == 200
        items = list_response.json()
        assert [item["prompt"] for item in items][:2] == ["Pinned", "Third"]
        assert items[0]["pinned_at"] is not None
        assert items[-1]["id"] == first_card["id"]

        pinned_only_response = await test_client.get("/review-cards/?pinned_only=true")
        assert pinned_only_response.status_code == 200
        pinned_only_items = pinned_only_response.json()
        assert [item["id"] for item in pinned_only_items] == [pinned_card["id"]]

    async def test_review_card_pinned_summary_updates_when_cards_are_pinned_and_unpinned(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Pinned summary")
        review_card = await _create_review_card(test_client, topic["id"])

        initial_response = await test_client.get("/review-cards/pinned-summary/")
        assert initial_response.status_code == 200
        assert initial_response.json() == {"pinned_count": 0}

        pin_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"pinned": True},
        )
        assert pin_response.status_code == 200

        pinned_response = await test_client.get("/review-cards/pinned-summary/")
        assert pinned_response.status_code == 200
        assert pinned_response.json() == {"pinned_count": 1}

        unpin_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"pinned": False},
        )
        assert unpin_response.status_code == 200

        unpinned_response = await test_client.get("/review-cards/pinned-summary/")
        assert unpinned_response.status_code == 200
        assert unpinned_response.json() == {"pinned_count": 0}

    async def test_review_card_pinned_summary_counts_only_authenticated_users_cards(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
    ):
        topic = await _create_topic(test_client, "Current user pinned summary")
        review_card = await _create_review_card(test_client, topic["id"])

        pin_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"pinned": True},
        )
        assert pin_response.status_code == 200

        other_topic = Topic(user_id="other-user-456", title="Other topic", body="")
        db_session.add(other_topic)
        await db_session.flush()

        db_session.add(
            ReviewCard(
                user_id="other-user-456",
                topic_id=other_topic.id,
                type="practice",
                prompt="Other user pinned card",
                answer="Answer",
                pinned_at=datetime.now(timezone.utc),
            )
        )
        await db_session.flush()

        response = await test_client.get("/review-cards/pinned-summary/")

        assert response.status_code == 200
        assert response.json() == {"pinned_count": 1}

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
