"""Integration tests for review-card queue endpoint."""

from datetime import date, timedelta

from httpx import AsyncClient

from app.review_cards import service as review_card_service


async def _create_topic(test_client: AsyncClient, title: str) -> dict:
    response = await test_client.post(
        "/topics/",
        json={"title": title, "body": ""},
    )
    assert response.status_code == 201
    return response.json()


async def _create_card(
    test_client: AsyncClient,
    topic_id: int,
    *,
    card_type: str,
    primary_text: str,
    retired: bool = False,
) -> dict:
    response = await test_client.post(
        "/review-cards/",
        json={
            "topic_id": topic_id,
            "type": card_type,
            "primary_text": primary_text,
            "secondary_text": "Answer",
            "retired": retired,
        },
    )
    assert response.status_code == 201
    return response.json()


class TestReviewQueueEndpoint:
    async def test_review_queue_returns_due_practice_items(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        topic = await _create_topic(test_client, "Queue topic")
        due_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Due card",
        )
        _ = await _create_card(
            test_client,
            topic["id"],
            card_type="flashcard",
            primary_text="Other type card",
        )
        hazy_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Hazy practice card",
        )

        due_review_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": due_card["id"],
                "scheduled_at": str(date.today() - timedelta(days=1)),
            },
        )
        assert due_review_response.status_code == 200
        due_review = due_review_response.json()

        completed_review_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": hazy_card["id"],
                "completed_at": str(date.today() - timedelta(days=2)),
                "rating": "good",
            },
        )
        assert completed_review_response.status_code == 200

        monkeypatch.setattr(
            review_card_service,
            "get_days_until_hazy",
            lambda review_card, *, today=None: (
                3 if review_card.id == hazy_card["id"] else None
            ),
        )

        queue_response = await test_client.get(
            "/review-cards/queue/?type=practice&mode=list"
        )

        assert queue_response.status_code == 200
        payload = queue_response.json()
        queue = payload["items"]
        assert payload["asOf"] == str(date.today())
        assert len(queue) == 2

        due_item = next(item for item in queue if item["queueType"] == "due")
        assert due_item["reviewId"] == due_review["id"]
        assert due_item["card"]["id"] == due_card["id"]
        assert due_item["card"]["type"] == "practice"
        assert due_item["actionDays"] == -1
        assert due_item["daysUntilHazy"] is None

        hazy_item = next(item for item in queue if item["queueType"] == "hazy")
        assert hazy_item["reviewId"] is None
        assert hazy_item["scheduledAt"] is None
        assert hazy_item["card"]["id"] == hazy_card["id"]
        assert hazy_item["card"]["type"] == "practice"
        assert hazy_item["actionDays"] == 3
        assert hazy_item["daysUntilHazy"] == 3

    async def test_review_card_queue_filter_returns_mixed_and_filtered_due_items(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        today = date(2026, 1, 15)
        monkeypatch.setattr(
            review_card_service,
            "get_current_date",
            lambda: today,
        )

        topic = await _create_topic(test_client, "Mixed due queue")
        practice_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Due practice",
        )
        flashcard = await _create_card(
            test_client,
            topic["id"],
            card_type="flashcard",
            primary_text="Due flashcard",
        )

        for card_id in [practice_card["id"], flashcard["id"]]:
            response = await test_client.post(
                "/reviews/",
                json={
                    "review_card_id": card_id,
                    "scheduled_at": str(today),
                },
            )
            assert response.status_code == 200

        all_response = await test_client.get(
            "/review-cards/queue/?filter=all&mode=list"
        )
        practice_response = await test_client.get(
            "/review-cards/queue/?filter=practice&mode=list"
        )
        flashcards_response = await test_client.get(
            "/review-cards/queue/?filter=flashcards&mode=list"
        )

        assert all_response.status_code == 200
        assert practice_response.status_code == 200
        assert flashcards_response.status_code == 200
        assert [
            item["card"]["primaryText"] for item in all_response.json()["items"]
        ] == ["Due practice", "Due flashcard"]
        assert [
            item["card"]["primaryText"] for item in practice_response.json()["items"]
        ] == ["Due practice"]
        assert [
            item["card"]["primaryText"] for item in flashcards_response.json()["items"]
        ] == ["Due flashcard"]

    async def test_review_card_queue_modes_order_combined_work(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        today = date(2026, 1, 15)
        monkeypatch.setattr(
            review_card_service,
            "get_current_date",
            lambda: today,
        )

        topic = await _create_topic(test_client, "Mode queue")
        overdue_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Overdue practice",
        )
        today_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Today practice",
        )
        future_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Future practice",
        )
        await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="New practice",
        )

        for card_id, scheduled_at in [
            (overdue_card["id"], today - timedelta(days=1)),
            (today_card["id"], today),
            (future_card["id"], today + timedelta(days=1)),
        ]:
            response = await test_client.post(
                "/reviews/",
                json={
                    "review_card_id": card_id,
                    "scheduled_at": str(scheduled_at),
                },
            )
            assert response.status_code == 200

        list_response = await test_client.get(
            "/review-cards/queue/?filter=practice&mode=list"
        )
        focus_response = await test_client.get(
            "/review-cards/queue/?filter=practice&mode=focus"
        )
        future_focus_response = await test_client.get(
            "/review-cards/queue/?filter=practice&mode=focus&include_future=true"
        )

        assert list_response.status_code == 200
        assert focus_response.status_code == 200
        assert future_focus_response.status_code == 200
        assert [
            item["card"]["primaryText"] for item in list_response.json()["items"]
        ] == [
            "New practice",
            "Overdue practice",
            "Today practice",
            "Future practice",
        ]
        assert [
            item["card"]["primaryText"] for item in focus_response.json()["items"]
        ] == ["Overdue practice", "Today practice", "New practice"]
        assert [
            item["card"]["primaryText"]
            for item in future_focus_response.json()["items"]
        ] == [
            "Overdue practice",
            "Today practice",
            "New practice",
            "Future practice",
        ]

    async def test_review_card_queue_rejects_invalid_mode(
        self,
        test_client: AsyncClient,
    ):
        response = await test_client.get(
            "/review-cards/queue/?filter=practice&mode=wat"
        )

        assert response.status_code == 422

    async def test_review_queue_prioritizes_recently_overdue_due_cards(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        today = date(2026, 1, 15)
        monkeypatch.setattr(
            review_card_service,
            "get_current_date",
            lambda: today,
        )

        topic = await _create_topic(test_client, "Overdue ordering")
        slightly_overdue_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Slightly overdue practice",
        )
        stale_overdue_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Stale overdue practice",
        )
        hazy_overdue_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Hazy overdue practice",
        )
        today_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Today practice",
        )
        tomorrow_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Tomorrow practice",
        )
        later_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Later practice",
        )

        for card_id, scheduled_at in [
            (slightly_overdue_card["id"], today - timedelta(days=1)),
            (stale_overdue_card["id"], today - timedelta(days=4)),
            (today_card["id"], today),
            (tomorrow_card["id"], today + timedelta(days=1)),
            (later_card["id"], today + timedelta(days=2)),
        ]:
            response = await test_client.post(
                "/reviews/",
                json={
                    "review_card_id": card_id,
                    "scheduled_at": str(scheduled_at),
                },
            )
            assert response.status_code == 200

        completed_review_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": hazy_overdue_card["id"],
                "completed_at": str(today - timedelta(days=2)),
                "rating": "good",
            },
        )
        assert completed_review_response.status_code == 200

        monkeypatch.setattr(
            review_card_service,
            "get_days_until_hazy",
            lambda review_card, *, today=None: (
                -2 if review_card.id == hazy_overdue_card["id"] else None
            ),
        )

        full_response = await test_client.get(
            "/review-cards/queue/?type=practice&mode=list"
        )
        focused_response = await test_client.get(
            "/review-cards/queue/?type=practice&mode=focus"
        )

        assert full_response.status_code == 200
        assert focused_response.status_code == 200
        assert [
            item["card"]["primaryText"] for item in full_response.json()["items"]
        ] == [
            "Slightly overdue practice",
            "Stale overdue practice",
            "Hazy overdue practice",
            "Today practice",
            "Tomorrow practice",
            "Later practice",
        ]
        assert [
            item["card"]["primaryText"] for item in focused_response.json()["items"]
        ] == [
            "Slightly overdue practice",
            "Stale overdue practice",
            "Hazy overdue practice",
            "Today practice",
        ]

    async def test_review_queue_returns_each_due_card_once_when_multiple_reviews_are_due(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        today = date(2026, 1, 15)
        monkeypatch.setattr(
            review_card_service,
            "get_current_date",
            lambda: today,
        )

        topic = await _create_topic(test_client, "Duplicate due queue")
        duplicated_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Duplicated due practice",
        )

        earlier_due_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": duplicated_card["id"],
                "scheduled_at": str(today - timedelta(days=3)),
            },
        )
        assert earlier_due_response.status_code == 200
        earlier_due_review = earlier_due_response.json()

        later_due_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": duplicated_card["id"],
                "scheduled_at": str(today - timedelta(days=1)),
            },
        )
        assert later_due_response.status_code == 200

        response = await test_client.get("/review-cards/queue/?type=practice&mode=list")

        assert response.status_code == 200
        items = response.json()["items"]
        assert len(items) == 1
        assert items[0]["card"]["id"] == duplicated_card["id"]
        assert items[0]["reviewId"] == earlier_due_review["id"]
        assert items[0]["scheduledAt"] == str(today - timedelta(days=3))
        assert items[0]["daysUntilDue"] == -3

    async def test_review_queue_focus_mode_returns_new_cards(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Focus queue")
        for index in range(7):
            await _create_card(
                test_client,
                topic["id"],
                card_type="practice",
                primary_text=f"Practice #{index}",
            )

        practice_focus_response = await test_client.get(
            "/review-cards/queue/?type=practice&mode=focus"
        )
        assert practice_focus_response.status_code == 200
        practice_items = practice_focus_response.json()["items"]
        assert len(practice_items) == 7
        assert all(item["queueType"] == "new" for item in practice_items)
        assert all(item["card"]["type"] == "practice" for item in practice_items)

    async def test_review_queue_includes_retired_scheduled_cards_and_excludes_retired_new_cards(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Retired queue")
        retired_due_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Retired due card",
            retired=True,
        )
        await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Active new card",
        )
        await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Retired new card",
            retired=True,
        )

        review_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": retired_due_card["id"],
                "scheduled_at": str(date.today()),
            },
        )
        assert review_response.status_code == 200

        response = await test_client.get("/review-cards/queue/?type=practice&mode=list")

        assert response.status_code == 200
        assert [item["card"]["primaryText"] for item in response.json()["items"]] == [
            "Active new card",
            "Retired due card",
        ]

    async def test_review_card_queue_summary_returns_aggregate_counts(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        # Pin "today" to avoid date-boundary flakiness in CI
        today = date(2026, 1, 15)
        monkeypatch.setattr(
            review_card_service,
            "get_current_date",
            lambda: today,
        )

        topic = await _create_topic(test_client, "Queue summary")
        overdue_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Overdue practice",
        )
        today_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Today practice",
        )
        soon_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Soon practice",
        )
        boundary_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Boundary practice",
        )
        _outside_window_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Later practice",
        )
        retired_overdue_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Retired overdue practice",
            retired=True,
        )
        hazy_overdue_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Hazy overdue practice",
        )
        hazy_today_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Hazy today practice",
        )
        hazy_soon_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Hazy soon practice",
        )
        hazy_boundary_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Hazy boundary practice",
        )
        await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="New practice",
        )
        await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Retired new practice",
            retired=True,
        )
        completed_new_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Reviewed practice",
        )
        other_type_card = await _create_card(
            test_client,
            topic["id"],
            card_type="flashcard",
            primary_text="Other type flashcard",
        )

        for card_id, scheduled_at in [
            (overdue_card["id"], today - timedelta(days=2)),
            (today_card["id"], today),
            (soon_card["id"], today + timedelta(days=3)),
            (boundary_card["id"], today + timedelta(days=7)),
            (_outside_window_card["id"], today + timedelta(days=9)),
            (retired_overdue_card["id"], today - timedelta(days=1)),
            (other_type_card["id"], today - timedelta(days=1)),
        ]:
            response = await test_client.post(
                "/reviews/",
                json={
                    "review_card_id": card_id,
                    "scheduled_at": str(scheduled_at),
                },
            )
            assert response.status_code == 200

        completed_review_response = await test_client.post(
            "/reviews/",
            json={
                "review_card_id": completed_new_card["id"],
                "completed_at": str(today),
            },
        )
        assert completed_review_response.status_code == 200

        for card_id in [
            hazy_overdue_card["id"],
            hazy_today_card["id"],
            hazy_soon_card["id"],
            hazy_boundary_card["id"],
        ]:
            response = await test_client.post(
                "/reviews/",
                json={
                    "review_card_id": card_id,
                    "completed_at": str(today - timedelta(days=2)),
                    "rating": "good",
                },
            )
            assert response.status_code == 200

        monkeypatch.setattr(
            review_card_service,
            "_get_hazy_action_days",
            lambda *, review_card_id, stability, last_reviewed_at, today=None: (
                -1
                if review_card_id == hazy_overdue_card["id"]
                else 0
                if review_card_id == hazy_today_card["id"]
                else 3
                if review_card_id == hazy_soon_card["id"]
                else 7
                if review_card_id == hazy_boundary_card["id"]
                else None
            ),
        )

        response = await test_client.get("/review-cards/queue-summary/?type=practice")
        all_response = await test_client.get("/review-cards/queue-summary/?filter=all")
        flashcards_response = await test_client.get(
            "/review-cards/queue-summary/?filter=flashcards"
        )

        assert response.status_code == 200
        assert all_response.status_code == 200
        assert flashcards_response.status_code == 200
        assert response.json() == {
            "overdueCount": 3,
            "dueTodayCount": 2,
            "dueNextSevenDaysCount": 9,
            "newCount": 6,
            "asOf": str(today),
        }
        assert all_response.json() == {
            "overdueCount": 4,
            "dueTodayCount": 2,
            "dueNextSevenDaysCount": 10,
            "newCount": 7,
            "asOf": str(today),
        }
        assert flashcards_response.json() == {
            "overdueCount": 1,
            "dueTodayCount": 0,
            "dueNextSevenDaysCount": 1,
            "newCount": 1,
            "asOf": str(today),
        }

    async def test_review_card_queue_summary_counts_due_cards_once_per_card(
        self,
        test_client: AsyncClient,
        monkeypatch,
    ):
        today = date(2026, 1, 15)
        monkeypatch.setattr(
            review_card_service,
            "get_current_date",
            lambda: today,
        )

        topic = await _create_topic(test_client, "Duplicate due summary")
        duplicated_overdue_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Duplicated overdue practice",
        )
        duplicated_today_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            primary_text="Duplicated today practice",
        )

        for scheduled_at in [today - timedelta(days=4), today - timedelta(days=1)]:
            response = await test_client.post(
                "/reviews/",
                json={
                    "review_card_id": duplicated_overdue_card["id"],
                    "scheduled_at": str(scheduled_at),
                },
            )
            assert response.status_code == 200

        for scheduled_at in [today, today + timedelta(days=2)]:
            response = await test_client.post(
                "/reviews/",
                json={
                    "review_card_id": duplicated_today_card["id"],
                    "scheduled_at": str(scheduled_at),
                },
            )
            assert response.status_code == 200

        response = await test_client.get("/review-cards/queue-summary/?type=practice")

        assert response.status_code == 200
        assert response.json() == {
            "overdueCount": 1,
            "dueTodayCount": 1,
            "dueNextSevenDaysCount": 2,
            "newCount": 2,
            "asOf": str(today),
        }
