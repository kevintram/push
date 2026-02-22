"""Integration tests for note-native review queue endpoint."""

from datetime import date, timedelta

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.review_queue import service as review_queue_service


class TestReviewQueueEndpoint:
    async def test_review_queue_returns_due_and_hazy_note_items(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        monkeypatch,
    ):
        test_session_factory = async_sessionmaker(
            bind=db_session.bind,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        monkeypatch.setattr(
            review_queue_service,
            "get_session_factory",
            lambda: test_session_factory,
        )

        due_note_response = await test_client.post(
            "/notes/",
            json={"title": "Due note", "body": "", "tags": ["TOPIC"]},
        )
        assert due_note_response.status_code == 201
        due_note = due_note_response.json()

        hazy_note_response = await test_client.post(
            "/notes/",
            json={"title": "Hazy note", "body": "", "tags": ["TOPIC"]},
        )
        assert hazy_note_response.status_code == 201
        hazy_note = hazy_note_response.json()

        due_review_response = await test_client.post(
            "/reviews/",
            json={
                "note_id": due_note["id"],
                "scheduled_at": str(date.today() - timedelta(days=1)),
            },
        )
        assert due_review_response.status_code == 200
        due_review = due_review_response.json()

        completed_review_response = await test_client.post(
            "/reviews/",
            json={
                "note_id": hazy_note["id"],
                "completed_at": str(date.today() - timedelta(days=2)),
                "rating": "good",
            },
        )
        assert completed_review_response.status_code == 200

        queue_response = await test_client.get("/review-queue/?limit=50")

        assert queue_response.status_code == 200
        payload = queue_response.json()
        queue = payload["items"]
        assert payload["next_cursor"] is None
        assert payload["as_of"] == str(date.today())
        assert len(queue) > 0
        assert all(item["entity_type"] == "note" for item in queue)
        assert all("note" in item for item in queue)

        due_item = next(
            item for item in queue if item.get("review_id") == due_review["id"]
        )
        assert due_item["queue_type"] == "due"
        assert due_item["note"]["id"] == due_note["id"]
        assert len(due_item["status_badges"]) > 0
        due_badge = due_item["status_badges"][0]
        assert due_badge["key"] == "due"
        assert due_badge["review_id"] == due_review["id"]

        hazy_item = next(
            item
            for item in queue
            if item["queue_type"] == "hazy" and item["note"]["id"] == hazy_note["id"]
        )
        assert hazy_item["review_id"] is None
        assert hazy_item["days_until_hazy"] is not None

    async def test_review_queue_cursor_pagination(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        monkeypatch,
    ):
        test_session_factory = async_sessionmaker(
            bind=db_session.bind,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        monkeypatch.setattr(
            review_queue_service,
            "get_session_factory",
            lambda: test_session_factory,
        )

        review_ids: list[int] = []
        for index in range(3):
            note_response = await test_client.post(
                "/notes/",
                json={"title": f"Due note {index}", "body": "", "tags": ["TOPIC"]},
            )
            assert note_response.status_code == 201
            note = note_response.json()

            review_response = await test_client.post(
                "/reviews/",
                json={
                    "note_id": note["id"],
                    "scheduled_at": str(date.today() - timedelta(days=(3 - index))),
                },
            )
            assert review_response.status_code == 200
            review_ids.append(review_response.json()["id"])

        first_page_response = await test_client.get("/review-queue/?limit=2")
        assert first_page_response.status_code == 200
        first_page = first_page_response.json()
        first_items = first_page["items"]
        assert len(first_items) == 2
        assert first_page["next_cursor"] is not None
        first_ids = {item["review_id"] for item in first_items}
        assert first_ids.issubset(set(review_ids))

        second_page_response = await test_client.get(
            f"/review-queue/?limit=2&cursor={first_page['next_cursor']}"
        )
        assert second_page_response.status_code == 200
        second_page = second_page_response.json()
        second_items = second_page["items"]
        assert len(second_items) == 1
        second_ids = {item["review_id"] for item in second_items}
        assert second_ids.issubset(set(review_ids))
        assert first_ids.isdisjoint(second_ids)
        assert second_page["next_cursor"] is None

    async def test_review_queue_invalid_cursor_returns_400(
        self,
        test_client: AsyncClient,
    ):
        response = await test_client.get(
            "/review-queue/?limit=10&cursor=not-a-valid-cursor"
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid review queue cursor"
