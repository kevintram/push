"""Integration tests for note-native reviews endpoints."""

from datetime import date, timedelta

from httpx import AsyncClient


class TestReviewsEndpoints:
    async def test_create_uncompleted_review_does_not_compute_fsrs(
        self,
        test_client: AsyncClient,
    ):
        note_response = await test_client.post(
            "/notes/",
            json={"title": "Uncompleted review note", "body": "", "tags": ["TOPIC"]},
        )
        assert note_response.status_code == 201
        note = note_response.json()

        response = await test_client.post(
            "/reviews/",
            json={
                "note_id": note["id"],
                "scheduled_at": str(date.today()),
            },
        )

        assert response.status_code == 200
        review = response.json()
        assert review["note_id"] == note["id"]
        assert review["completed_at"] is None
        assert review["rating"] is None
        assert review["stability_before"] is None
        assert review["stability_after"] is None

    async def test_create_completed_review_and_filter_by_note_id(
        self,
        test_client: AsyncClient,
    ):
        note_response = await test_client.post(
            "/notes/",
            json={"title": "Completed review note", "body": "", "tags": ["SOURCE"]},
        )
        assert note_response.status_code == 201
        note = note_response.json()

        create_response = await test_client.post(
            "/reviews/",
            json={
                "note_id": note["id"],
                "completed_at": str(date.today()),
                "rating": "good",
                "description": "First completed review",
                "notes": "Created with notes payload",
            },
        )
        assert create_response.status_code == 200
        created = create_response.json()
        assert created["note_id"] == note["id"]
        assert created["stability_after"] is not None
        assert created["notes"] == "Created with notes payload"

        list_response = await test_client.get(f"/reviews/?note_id={note['id']}")
        assert list_response.status_code == 200

        items = list_response.json()
        assert len(items) == 1
        assert items[0]["note_id"] == note["id"]
        assert items[0]["note"]["id"] == note["id"]
        assert items[0]["note"]["title"] == "Completed review note"

    async def test_update_review_can_reassign_note_id(
        self,
        test_client: AsyncClient,
    ):
        first_note_response = await test_client.post(
            "/notes/",
            json={"title": "First note", "body": "", "tags": ["TOPIC"]},
        )
        assert first_note_response.status_code == 201
        first_note = first_note_response.json()

        second_note_response = await test_client.post(
            "/notes/",
            json={"title": "Second note", "body": "", "tags": ["TOPIC"]},
        )
        assert second_note_response.status_code == 201
        second_note = second_note_response.json()

        create_response = await test_client.post(
            "/reviews/",
            json={
                "note_id": first_note["id"],
                "completed_at": str(date.today() - timedelta(days=1)),
                "rating": "good",
            },
        )
        assert create_response.status_code == 200
        review_id = create_response.json()["id"]

        update_response = await test_client.post(
            f"/reviews/{review_id}/",
            json={"note_id": second_note["id"]},
        )
        assert update_response.status_code == 200
        assert update_response.json()["note_id"] == second_note["id"]

        first_list = await test_client.get(f"/reviews/?note_id={first_note['id']}")
        second_list = await test_client.get(f"/reviews/?note_id={second_note['id']}")

        assert first_list.status_code == 200
        assert second_list.status_code == 200
        assert len(first_list.json()) == 0
        assert len(second_list.json()) == 1
        assert second_list.json()[0]["id"] == review_id

    async def test_create_review_with_multiple_targets_fails_validation(
        self,
        test_client: AsyncClient,
    ):
        note_response = await test_client.post(
            "/notes/",
            json={"title": "Validation note", "body": "", "tags": ["TOPIC"]},
        )
        assert note_response.status_code == 201
        note = note_response.json()

        response = await test_client.post(
            "/reviews/",
            json={
                "note_id": note["id"],
                "topic_id": note["id"],
                "scheduled_at": str(date.today()),
            },
        )

        assert response.status_code == 422
