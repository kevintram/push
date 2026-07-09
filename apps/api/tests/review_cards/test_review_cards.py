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
    primary_text: str = "Prompt",
    secondary_text: str = "Answer",
    notes: str = "",
) -> dict:
    response = await test_client.post(
        "/review-cards/",
        json={
            "topic_id": topic_id,
            "type": card_type,
            "primary_text": primary_text,
            "secondary_text": secondary_text,
            "notes": notes,
        },
    )
    assert response.status_code == 201
    return response.json()


async def _create_review(
    test_client: AsyncClient,
    review_card_id: int,
    *,
    scheduled_at: str | None = None,
    completed_at: str | None = None,
    rating: str | None = None,
) -> dict:
    payload: dict[str, object] = {"review_card_id": review_card_id}
    if scheduled_at is not None:
        payload["scheduled_at"] = scheduled_at
    if completed_at is not None:
        payload["completed_at"] = completed_at
    if rating is not None:
        payload["rating"] = rating

    response = await test_client.post("/reviews/", json=payload)
    assert response.status_code == 200
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
                "primary_text": "Prompt",
                "secondary_text": "Answer",
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
                "primary_text": "Prompt",
                "secondary_text": "Answer",
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

    async def test_list_review_cards_orders_newest_first_and_filters_flagged(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Flagged list")
        first_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="First",
        )
        flagged_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Flagged",
        )
        _third_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Third",
        )

        flag_response = await test_client.patch(
            f"/review-cards/{flagged_card['id']}/",
            json={"flagged": True},
        )
        assert flag_response.status_code == 200

        list_response = await test_client.get(f"/review-cards/?topic_id={topic['id']}")
        assert list_response.status_code == 200
        items = list_response.json()
        assert [item["primary_text"] for item in items] == ["Third", "Flagged", "First"]
        assert items[1]["flagged_at"] is not None
        assert items[-1]["id"] == first_card["id"]

        flagged_response = await test_client.get("/review-cards/?flagged=true")
        assert flagged_response.status_code == 200
        flagged_items = flagged_response.json()
        assert [item["id"] for item in flagged_items] == [flagged_card["id"]]

    async def test_list_review_cards_filters_new_cards(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "New list")
        reviewed_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Reviewed",
        )
        new_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="New",
        )

        await _create_review(
            test_client,
            reviewed_card["id"],
            completed_at="2026-01-15",
            rating="good",
        )

        response = await test_client.get("/review-cards/?due=new")

        assert response.status_code == 200
        assert [item["id"] for item in response.json()] == [new_card["id"]]

    async def test_list_review_cards_filters_exact_due_date(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Exact due")
        due_card = await _create_review_card(
            test_client, topic["id"], primary_text="Due"
        )
        other_due_card = await _create_review_card(
            test_client,
            topic["id"],
            primary_text="Other due",
        )
        unscheduled_card = await _create_review_card(
            test_client,
            topic["id"],
            primary_text="Unscheduled",
        )
        await _create_review(test_client, due_card["id"], scheduled_at="2026-07-09")
        await _create_review(
            test_client,
            other_due_card["id"],
            scheduled_at="2026-07-10",
        )
        await _create_review(test_client, unscheduled_card["id"])

        response = await test_client.get("/review-cards/?due=2026-07-09")

        assert response.status_code == 200
        assert [item["id"] for item in response.json()] == [due_card["id"]]

    async def test_list_review_cards_filters_late_due_date_from_client_date(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Late due")
        late_card = await _create_review_card(
            test_client, topic["id"], primary_text="Late"
        )
        today_card = await _create_review_card(
            test_client, topic["id"], primary_text="Today"
        )
        future_card = await _create_review_card(
            test_client,
            topic["id"],
            primary_text="Future",
        )
        await _create_review(test_client, late_card["id"], scheduled_at="2026-07-08")
        await _create_review(test_client, today_card["id"], scheduled_at="2026-07-09")
        await _create_review(test_client, future_card["id"], scheduled_at="2026-07-10")

        response = await test_client.get(
            "/review-cards/?due=late",
            headers={"X-Client-Date": "2026-07-09"},
        )

        assert response.status_code == 200
        assert [item["id"] for item in response.json()] == [late_card["id"]]

    async def test_list_review_cards_filters_retired(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Retired list")
        active_card = await _create_review_card(
            test_client, topic["id"], primary_text="Active"
        )
        retired_card = await _create_review_card(
            test_client,
            topic["id"],
            primary_text="Retired",
        )
        retire_response = await test_client.patch(
            f"/review-cards/{retired_card['id']}/",
            json={"retired": True},
        )
        assert retire_response.status_code == 200

        retired_response = await test_client.get("/review-cards/?retired=true")
        active_response = await test_client.get("/review-cards/?retired=false")
        all_response = await test_client.get("/review-cards/")

        assert retired_response.status_code == 200
        assert active_response.status_code == 200
        assert all_response.status_code == 200
        assert [item["id"] for item in retired_response.json()] == [retired_card["id"]]
        assert [item["id"] for item in active_response.json()] == [active_card["id"]]
        assert {item["id"] for item in all_response.json()} == {
            active_card["id"],
            retired_card["id"],
        }

    async def test_list_review_cards_orders_by_due_with_nulls_first(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Due order")
        no_due_card = await _create_review_card(
            test_client, topic["id"], primary_text="No due"
        )
        later_card = await _create_review_card(
            test_client, topic["id"], primary_text="Later"
        )
        earlier_card = await _create_review_card(
            test_client, topic["id"], primary_text="Earlier"
        )
        await _create_review(test_client, later_card["id"], scheduled_at="2026-07-10")
        await _create_review(test_client, earlier_card["id"], scheduled_at="2026-07-09")

        response = await test_client.get("/review-cards/?order_by=due")

        assert response.status_code == 200
        assert [item["id"] for item in response.json()] == [
            no_due_card["id"],
            earlier_card["id"],
            later_card["id"],
        ]

    async def test_list_review_cards_orders_by_desc_inserted_at(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Inserted order")
        first_card = await _create_review_card(
            test_client, topic["id"], primary_text="First"
        )
        second_card = await _create_review_card(
            test_client, topic["id"], primary_text="Second"
        )
        third_card = await _create_review_card(
            test_client, topic["id"], primary_text="Third"
        )

        response = await test_client.get("/review-cards/?order_by=-inserted_at")

        assert response.status_code == 200
        assert [item["id"] for item in response.json()] == [
            third_card["id"],
            second_card["id"],
            first_card["id"],
        ]

    async def test_list_review_cards_orders_by_multiple_fields(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Multi order")
        no_due_card = await _create_review_card(
            test_client, topic["id"], primary_text="No due"
        )
        older_due_card = await _create_review_card(
            test_client, topic["id"], primary_text="Older due"
        )
        newer_due_card = await _create_review_card(
            test_client, topic["id"], primary_text="Newer due"
        )
        await _create_review(
            test_client, older_due_card["id"], scheduled_at="2026-07-09"
        )
        await _create_review(
            test_client, newer_due_card["id"], scheduled_at="2026-07-09"
        )

        response = await test_client.get("/review-cards/?order_by=due,-inserted_at")

        assert response.status_code == 200
        assert [item["id"] for item in response.json()] == [
            no_due_card["id"],
            newer_due_card["id"],
            older_due_card["id"],
        ]

    async def test_list_review_cards_rejects_unknown_order_by_field(
        self,
        test_client: AsyncClient,
    ):
        response = await test_client.get("/review-cards/?order_by=bogus")

        assert response.status_code == 400
        assert response.json()["detail"] == "Unknown order_by field: bogus"

    async def test_list_review_cards_rejects_unknown_due_value(
        self,
        test_client: AsyncClient,
    ):
        response = await test_client.get("/review-cards/?due=bogus")

        assert response.status_code == 422

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
            primary_text="Root card",
        )
        child_card = await _create_review_card(
            test_client,
            child["id"],
            card_type="flashcard",
            primary_text="Child card",
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
            primary_text="Child card",
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
                primary_text="Other user flagged card",
                secondary_text="Answer",
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
                "primary_text": "Prompt",
                "secondary_text": "Answer",
                "srs_enabled": True,
            },
        )

        assert response.status_code == 422
