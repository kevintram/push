"""Integration tests for review-card endpoints."""

from datetime import date, datetime, timedelta, timezone

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_cards import ReviewCard
from app.models.topics import Topic
from app.review_cards import service as review_card_service


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


def _patch_hazy_days(monkeypatch, hazy_days_by_card_id: dict[int, int]) -> None:
    monkeypatch.setattr(
        review_card_service,
        "get_days_until_hazy",
        lambda review_card, *, today=None: hazy_days_by_card_id.get(review_card.id),
    )


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

    async def test_list_review_cards_exposes_next_due_at(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Next due")
        scheduled_card = await _create_review_card(
            test_client, topic["id"], primary_text="Scheduled"
        )
        completed_only_card = await _create_review_card(
            test_client, topic["id"], primary_text="Completed"
        )
        unscheduled_card = await _create_review_card(
            test_client, topic["id"], primary_text="Unscheduled"
        )
        # next_due_at is the earliest uncompleted scheduled review.
        await _create_review(
            test_client, scheduled_card["id"], scheduled_at="2026-07-20"
        )
        await _create_review(
            test_client, scheduled_card["id"], scheduled_at="2026-07-15"
        )
        # A completed review must not count toward next_due_at.
        await _create_review(
            test_client,
            completed_only_card["id"],
            scheduled_at="2026-07-12",
            completed_at="2026-07-12",
        )
        await _create_review(test_client, unscheduled_card["id"])

        response = await test_client.get(f"/review-cards/?topic_id={topic['id']}")

        assert response.status_code == 200
        next_due_by_id = {
            item["id"]: item["next_due_at"] for item in response.json()
        }
        assert next_due_by_id[scheduled_card["id"]] == "2026-07-15"
        assert next_due_by_id[completed_only_card["id"]] is None
        assert next_due_by_id[unscheduled_card["id"]] is None

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

    async def test_list_review_cards_due_filters_include_matching_hazy_cards(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        today = date(2026, 7, 9)
        topic = await _create_topic(test_client, "Hazy due filters")
        scheduled_late_card = await _create_review_card(
            test_client, topic["id"], primary_text="Scheduled late"
        )
        scheduled_today_card = await _create_review_card(
            test_client, topic["id"], primary_text="Scheduled today"
        )
        hazy_late_card = await _create_review_card(
            test_client, topic["id"], primary_text="Hazy late"
        )
        hazy_today_card = await _create_review_card(
            test_client, topic["id"], primary_text="Hazy today"
        )
        hazy_future_card = await _create_review_card(
            test_client, topic["id"], primary_text="Hazy future"
        )
        future_scheduled_hazy_card = await _create_review_card(
            test_client, topic["id"], primary_text="Future scheduled hazy"
        )
        retired_hazy_card = await _create_review_card(
            test_client, topic["id"], primary_text="Retired hazy"
        )

        await _create_review(
            test_client,
            scheduled_late_card["id"],
            scheduled_at=str(today - timedelta(days=1)),
        )
        await _create_review(
            test_client, scheduled_today_card["id"], scheduled_at=str(today)
        )
        await _create_review(
            test_client,
            future_scheduled_hazy_card["id"],
            scheduled_at=str(today + timedelta(days=7)),
        )
        retire_response = await test_client.patch(
            f"/review-cards/{retired_hazy_card['id']}/",
            json={"retired": True},
        )
        assert retire_response.status_code == 200

        _patch_hazy_days(
            monkeypatch,
            {
                hazy_late_card["id"]: -2,
                hazy_today_card["id"]: 0,
                hazy_future_card["id"]: 3,
                future_scheduled_hazy_card["id"]: -2,
                retired_hazy_card["id"]: -2,
            },
        )

        late_response = await test_client.get(
            "/review-cards/?due=late",
            headers={"X-Client-Date": str(today)},
        )
        today_response = await test_client.get(
            f"/review-cards/?due={today}",
            headers={"X-Client-Date": str(today)},
        )
        future_response = await test_client.get(
            f"/review-cards/?due={today + timedelta(days=3)}",
            headers={"X-Client-Date": str(today)},
        )
        retired_response = await test_client.get(
            "/review-cards/?due=late&retired=true",
            headers={"X-Client-Date": str(today)},
        )

        assert late_response.status_code == 200
        assert today_response.status_code == 200
        assert future_response.status_code == 200
        assert retired_response.status_code == 200
        assert {item["id"] for item in late_response.json()} == {
            scheduled_late_card["id"],
            hazy_late_card["id"],
        }
        assert {item["id"] for item in today_response.json()} == {
            scheduled_today_card["id"],
            hazy_today_card["id"],
        }
        assert [item["id"] for item in future_response.json()] == [
            hazy_future_card["id"]
        ]
        assert retired_response.json() == []

    async def test_list_review_cards_hazy_due_cards_respect_filters(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        today = date(2026, 7, 9)
        root = await _create_topic(test_client, "Filtered hazy root")
        child_response = await test_client.post(
            "/topics/",
            json={"title": "Filtered hazy child", "body": "", "parent_id": root["id"]},
        )
        assert child_response.status_code == 201
        child = child_response.json()
        outside = await _create_topic(test_client, "Filtered hazy outside")

        matching_card = await _create_review_card(
            test_client,
            child["id"],
            card_type="practice",
            primary_text="Matching hazy",
        )
        wrong_type_card = await _create_review_card(
            test_client,
            child["id"],
            card_type="flashcard",
            primary_text="Wrong type hazy",
        )
        unflagged_card = await _create_review_card(
            test_client,
            child["id"],
            card_type="practice",
            primary_text="Unflagged hazy",
        )
        outside_card = await _create_review_card(
            test_client,
            outside["id"],
            card_type="practice",
            primary_text="Outside hazy",
        )

        for card in [matching_card, wrong_type_card, outside_card]:
            flag_response = await test_client.patch(
                f"/review-cards/{card['id']}/",
                json={"flagged": True},
            )
            assert flag_response.status_code == 200

        _patch_hazy_days(
            monkeypatch,
            {
                matching_card["id"]: -2,
                wrong_type_card["id"]: -2,
                unflagged_card["id"]: -2,
                outside_card["id"]: -2,
            },
        )

        response = await test_client.get(
            "/review-cards/"
            f"?due=late&topic_id={root['id']}&include_descendants=true"
            "&type=practice&flagged=true",
            headers={"X-Client-Date": str(today)},
        )

        assert response.status_code == 200
        assert [item["id"] for item in response.json()] == [matching_card["id"]]

    async def test_list_review_cards_orders_merged_hazy_and_scheduled_due_cards(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        today = date(2026, 7, 9)
        topic = await _create_topic(test_client, "Merged due order")
        scheduled_older_card = await _create_review_card(
            test_client, topic["id"], primary_text="Scheduled older"
        )
        hazy_older_card = await _create_review_card(
            test_client, topic["id"], primary_text="Hazy older"
        )
        scheduled_tie_card = await _create_review_card(
            test_client, topic["id"], primary_text="Scheduled tie"
        )
        hazy_tie_card = await _create_review_card(
            test_client, topic["id"], primary_text="Hazy tie"
        )

        await _create_review(
            test_client,
            scheduled_older_card["id"],
            scheduled_at=str(today - timedelta(days=2)),
        )
        await _create_review(
            test_client,
            scheduled_tie_card["id"],
            scheduled_at=str(today - timedelta(days=1)),
        )
        _patch_hazy_days(
            monkeypatch,
            {
                hazy_older_card["id"]: -3,
                hazy_tie_card["id"]: -2,
            },
        )

        ascending_response = await test_client.get(
            "/review-cards/?due=late&order_by=due",
            headers={"X-Client-Date": str(today)},
        )
        descending_response = await test_client.get(
            "/review-cards/?due=late&order_by=-due",
            headers={"X-Client-Date": str(today)},
        )

        assert ascending_response.status_code == 200
        assert descending_response.status_code == 200
        assert [item["id"] for item in ascending_response.json()] == [
            scheduled_older_card["id"],
            hazy_older_card["id"],
            scheduled_tie_card["id"],
            hazy_tie_card["id"],
        ]
        assert [item["id"] for item in descending_response.json()] == [
            scheduled_tie_card["id"],
            hazy_tie_card["id"],
            scheduled_older_card["id"],
            hazy_older_card["id"],
        ]

    async def test_list_review_cards_due_filter_counts_match_queue_summary(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        today = date(2026, 7, 9)
        topic = await _create_topic(test_client, "Due queue parity")
        scheduled_late_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Scheduled late parity",
        )
        scheduled_today_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Scheduled today parity",
        )
        hazy_late_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Hazy late parity",
        )
        hazy_today_card = await _create_review_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Hazy today parity",
        )

        await _create_review(
            test_client,
            scheduled_late_card["id"],
            scheduled_at=str(today - timedelta(days=1)),
        )
        await _create_review(
            test_client, scheduled_today_card["id"], scheduled_at=str(today)
        )
        _patch_hazy_days(
            monkeypatch,
            {
                hazy_late_card["id"]: -2,
                hazy_today_card["id"]: 0,
            },
        )
        monkeypatch.setattr(
            review_card_service,
            "_get_hazy_action_days",
            lambda *, review_card_id, stability, last_reviewed_at, today: (
                -1
                if review_card_id == hazy_late_card["id"]
                else 0
                if review_card_id == hazy_today_card["id"]
                else None
            ),
        )

        late_response = await test_client.get(
            "/review-cards/?due=late&type=practice",
            headers={"X-Client-Date": str(today)},
        )
        today_response = await test_client.get(
            f"/review-cards/?due={today}&type=practice",
            headers={"X-Client-Date": str(today)},
        )
        summary_response = await test_client.get(
            "/review-cards/queue-summary/?type=practice",
            headers={"X-Client-Date": str(today)},
        )

        assert late_response.status_code == 200
        assert today_response.status_code == 200
        assert summary_response.status_code == 200
        summary = summary_response.json()
        assert len(late_response.json()) == summary["overdue_count"] == 2
        assert len(today_response.json()) == summary["due_today_count"] == 2

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
