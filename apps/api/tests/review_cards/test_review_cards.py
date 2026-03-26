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
    answer: str = "Answer",
    notes: str = "",
) -> dict:
    response = await test_client.post(
        "/review-cards/",
        json={
            "topic_id": topic_id,
            "type": card_type,
            "prompt": prompt,
            "answer": answer,
            "notes": notes,
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
                "notes": "Reference material",
            },
        )

        assert response.status_code == 201
        payload = response.json()
        assert payload["retired"] is False
        assert payload["flagged_at"] is None
        assert payload["notes"] == "Reference material"
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

    async def test_update_review_card_can_toggle_flagged(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Flagged toggle")
        review_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
        )

        update_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"flagged": True},
        )

        assert update_response.status_code == 200
        payload = update_response.json()
        assert payload["flagged_at"] is not None

        unflag_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"flagged": False},
        )

        assert unflag_response.status_code == 200
        assert unflag_response.json()["flagged_at"] is None

    async def test_update_review_card_notes(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Card notes")
        review_card = await _create_review_card(
            test_client,
            topic["id"],
            notes="Initial notes",
        )

        update_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"notes": "Updated notes"},
        )

        assert update_response.status_code == 200
        assert update_response.json()["notes"] == "Updated notes"

    async def test_list_review_cards_orders_flagged_first_and_filters_flagged_only(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Flagged list")
        first_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="First",
        )
        flagged_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Flagged",
        )
        _third_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Third",
        )

        flag_response = await test_client.patch(
            f"/review-cards/{flagged_card['id']}/",
            json={"flagged": True},
        )
        assert flag_response.status_code == 200

        list_response = await test_client.get(f"/review-cards/?topic_id={topic['id']}")
        assert list_response.status_code == 200
        items = list_response.json()
        assert [item["prompt"] for item in items][:2] == ["Flagged", "Third"]
        assert items[0]["flagged_at"] is not None
        assert items[-1]["id"] == first_card["id"]

        flagged_only_response = await test_client.get(
            "/review-cards/?flagged_only=true"
        )
        assert flagged_only_response.status_code == 200
        flagged_only_items = flagged_only_response.json()
        assert [item["id"] for item in flagged_only_items] == [flagged_card["id"]]

    async def test_list_review_cards_can_include_descendants(
        self,
        test_client: AsyncClient,
    ):
        root = await _create_topic(test_client, "Mathematics")
        child_response = await test_client.post(
            "/topics/",
            json={"title": "Algebra", "body": "", "parent_id": root["id"]},
        )
        assert child_response.status_code == 201
        child = child_response.json()

        root_card = await _create_review_card(
            test_client,
            root["id"],
            card_type="practice",
            prompt="Root card",
        )
        child_card = await _create_review_card(
            test_client,
            child["id"],
            card_type="flashcard",
            prompt="Child card",
        )
        _outside_topic = await _create_topic(test_client, "Geometry")

        response = await test_client.get(
            f"/review-cards/?topic_id={root['id']}&include_descendants=true"
        )

        assert response.status_code == 200
        payload = response.json()
        assert {item["id"] for item in payload} == {root_card["id"], child_card["id"]}

    async def test_list_review_cards_include_descendants_after_reparenting_root(
        self,
        test_client: AsyncClient,
    ):
        root = await _create_topic(test_client, "Computer Science")
        child_response = await test_client.post(
            "/topics/",
            json={"title": "Algorithms", "body": "", "parent_id": root["id"]},
        )
        assert child_response.status_code == 201
        child = child_response.json()
        new_parent = await _create_topic(test_client, "Mathematics")

        move_response = await test_client.patch(
            f"/topics/{root['id']}/",
            json={"parent_id": new_parent["id"]},
        )
        assert move_response.status_code == 200

        child_card = await _create_review_card(
            test_client,
            child["id"],
            card_type="flashcard",
            prompt="Child card",
        )

        response = await test_client.get(
            f"/review-cards/?topic_id={root['id']}&include_descendants=true"
        )

        assert response.status_code == 200
        payload = response.json()
        assert {item["id"] for item in payload} == {child_card["id"]}

    async def test_list_review_cards_rejects_include_descendants_without_topic_id(
        self,
        test_client: AsyncClient,
    ):
        response = await test_client.get("/review-cards/?include_descendants=true")

        assert response.status_code == 400
        assert response.json()["detail"] == (
            "topic_id is required when include_descendants is true"
        )

    async def test_review_card_flagged_summary_updates_when_cards_are_flagged_and_unflagged(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Flagged summary")
        review_card = await _create_review_card(test_client, topic["id"])

        initial_response = await test_client.get("/review-cards/flagged-summary/")
        assert initial_response.status_code == 200
        assert initial_response.json() == {"flagged_count": 0}

        flag_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"flagged": True},
        )
        assert flag_response.status_code == 200

        flagged_response = await test_client.get("/review-cards/flagged-summary/")
        assert flagged_response.status_code == 200
        assert flagged_response.json() == {"flagged_count": 1}

        unflag_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"flagged": False},
        )
        assert unflag_response.status_code == 200

        unflagged_response = await test_client.get("/review-cards/flagged-summary/")
        assert unflagged_response.status_code == 200
        assert unflagged_response.json() == {"flagged_count": 0}

    async def test_review_card_flagged_summary_counts_only_authenticated_users_cards(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
    ):
        topic = await _create_topic(test_client, "Current user flagged summary")
        review_card = await _create_review_card(test_client, topic["id"])

        flag_response = await test_client.patch(
            f"/review-cards/{review_card['id']}/",
            json={"flagged": True},
        )
        assert flag_response.status_code == 200

        other_topic = Topic(user_id="other-user-456", title="Other topic", body="")
        db_session.add(other_topic)
        await db_session.flush()

        db_session.add(
            ReviewCard(
                user_id="other-user-456",
                topic_id=other_topic.id,
                type="practice",
                prompt="Other user flagged card",
                answer="Answer",
                flagged_at=datetime.now(timezone.utc),
            )
        )
        await db_session.flush()

        response = await test_client.get("/review-cards/flagged-summary/")

        assert response.status_code == 200
        assert response.json() == {"flagged_count": 1}

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
