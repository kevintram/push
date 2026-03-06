"""Integration tests for review-card queue endpoint."""

from datetime import date, timedelta

from httpx import AsyncClient


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
    prompt: str,
    retired: bool = False,
) -> dict:
    response = await test_client.post(
        "/review-cards/",
        json={
            "topic_id": topic_id,
            "type": card_type,
            "prompt": prompt,
            "answer": "Answer",
            "retired": retired,
        },
    )
    assert response.status_code == 201
    return response.json()


class TestReviewQueueEndpoint:
    async def test_review_queue_returns_due_practice_items(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Queue topic")
        due_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Due card",
        )
        _ = await _create_card(
            test_client,
            topic["id"],
            card_type="flashcard",
            prompt="Other type card",
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

        queue_response = await test_client.get("/review-queue/?type=practice&tab=due")

        assert queue_response.status_code == 200
        payload = queue_response.json()
        queue = payload["items"]
        assert payload["as_of"] == str(date.today())
        assert len(queue) == 1
        assert queue[0]["queue_type"] == "due"
        assert queue[0]["review_id"] == due_review["id"]
        assert queue[0]["card"]["id"] == due_card["id"]
        assert queue[0]["card"]["type"] == "practice"

    async def test_review_queue_returns_new_cards_and_respects_focused_limit(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Focused queue")
        for index in range(7):
            await _create_card(
                test_client,
                topic["id"],
                card_type="practice",
                prompt=f"Practice #{index}",
            )

        practice_focus_response = await test_client.get(
            "/review-queue/?type=practice&tab=new&focused=true"
        )
        assert practice_focus_response.status_code == 200
        practice_items = practice_focus_response.json()["items"]
        assert len(practice_items) == 5
        assert all(item["queue_type"] == "new" for item in practice_items)
        assert all(item["card"]["type"] == "practice" for item in practice_items)

    async def test_review_queue_focused_flashcards_returns_single_item(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Flashcard focus")
        for index in range(3):
            await _create_card(
                test_client,
                topic["id"],
                card_type="flashcard",
                prompt=f"Flashcard #{index}",
            )

        response = await test_client.get(
            "/review-queue/?type=flashcard&tab=new&focused=true"
        )
        assert response.status_code == 200
        items = response.json()["items"]
        assert len(items) == 1
        assert items[0]["card"]["type"] == "flashcard"

    async def test_review_queue_excludes_retired_cards_from_due_and_new_tabs(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Retired queue")
        retired_due_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Retired due card",
            retired=True,
        )
        await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Active new card",
        )
        await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Retired new card",
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

        due_response = await test_client.get("/review-queue/?type=practice&tab=due")
        new_response = await test_client.get("/review-queue/?type=practice&tab=new")

        assert due_response.status_code == 200
        assert new_response.status_code == 200
        assert due_response.json()["items"] == []
        assert [item["card"]["prompt"] for item in new_response.json()["items"]] == [
            "Active new card"
        ]

    async def test_review_card_queue_summary_returns_aggregate_counts(
        self,
        test_client: AsyncClient,
    ):
        topic = await _create_topic(test_client, "Queue summary")
        overdue_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Overdue practice",
        )
        today_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Today practice",
        )
        soon_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Soon practice",
        )
        _outside_window_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Later practice",
        )
        await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="New practice",
        )
        await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Retired new practice",
            retired=True,
        )
        completed_new_card = await _create_card(
            test_client,
            topic["id"],
            card_type="practice",
            prompt="Reviewed practice",
        )
        other_type_card = await _create_card(
            test_client,
            topic["id"],
            card_type="flashcard",
            prompt="Other type flashcard",
        )

        for card_id, scheduled_at in [
            (overdue_card["id"], date.today() - timedelta(days=2)),
            (today_card["id"], date.today()),
            (soon_card["id"], date.today() + timedelta(days=3)),
            (_outside_window_card["id"], date.today() + timedelta(days=9)),
            (other_type_card["id"], date.today() - timedelta(days=1)),
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
                "completed_at": str(date.today()),
            },
        )
        assert completed_review_response.status_code == 200

        response = await test_client.get("/review-cards/queue-summary/?type=practice")

        assert response.status_code == 200
        assert response.json() == {
            "overdue_count": 1,
            "due_today_count": 1,
            "due_next_seven_days_count": 1,
            "new_count": 5,
            "as_of": str(date.today()),
        }
