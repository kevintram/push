from datetime import date, timedelta

from httpx import AsyncClient


class TestNotesEndpoints:
    async def test_create_and_read_note(self, test_client: AsyncClient):
        response = await test_client.post(
            "/notes/",
            json={
                "title": "Unified note",
                "body": "Body",
                "tags": ["TOPIC", "SOURCE"],
                "reading_status": "IN_PROGRESS",
                "in_reading_list": True,
            },
        )

        assert response.status_code == 201
        created = response.json()
        assert created["title"] == "Unified note"
        assert sorted(created["tags"]) == ["SOURCE", "TOPIC"]
        assert created["reading_status"] == "IN_PROGRESS"
        assert created["in_reading_list"] is True
        assert created["status_badges"] == []

        read_response = await test_client.get(f"/notes/{created['id']}/")
        assert read_response.status_code == 200
        fetched = read_response.json()
        assert fetched["id"] == created["id"]
        assert sorted(fetched["tags"]) == ["SOURCE", "TOPIC"]
        assert fetched["status_badges"] == []

    async def test_read_list_filter_uses_in_reading_list(
        self, test_client: AsyncClient
    ):
        keep_response = await test_client.post(
            "/notes/",
            json={
                "title": "Keep",
                "body": "",
                "tags": ["SOURCE"],
                "in_reading_list": True,
                "reading_status": "NEW",
            },
        )
        assert keep_response.status_code == 201
        keep_note = keep_response.json()

        drop_response = await test_client.post(
            "/notes/",
            json={
                "title": "Skip",
                "body": "",
                "tags": ["TOPIC"],
                "in_reading_list": False,
                "reading_status": "NEW",
            },
        )
        assert drop_response.status_code == 201

        list_response = await test_client.get(
            "/notes/?in_reading_list=true&archived=false"
        )
        assert list_response.status_code == 200
        note_ids = {item["id"] for item in list_response.json()}
        assert keep_note["id"] in note_ids
        assert len(note_ids) == 1

    async def test_covers_relation_requires_source_tag(self, test_client: AsyncClient):
        from_response = await test_client.post(
            "/notes/",
            json={"title": "From", "body": "", "tags": ["TOPIC"]},
        )
        assert from_response.status_code == 201
        from_note = from_response.json()

        to_response = await test_client.post(
            "/notes/",
            json={"title": "To", "body": "", "tags": ["TOPIC"]},
        )
        assert to_response.status_code == 201
        to_note = to_response.json()

        relation_response = await test_client.post(
            f"/notes/{from_note['id']}/relations/",
            json={"to_id": to_note["id"], "relation_type": "COVERS"},
        )
        assert relation_response.status_code == 400
        assert "SOURCE tag" in relation_response.json()["detail"]

    async def test_note_status_badges_use_client_date_header(
        self, test_client: AsyncClient
    ):
        note_response = await test_client.post(
            "/notes/",
            json={"title": "Date-scoped badge note", "body": "", "tags": ["TOPIC"]},
        )
        assert note_response.status_code == 201
        note = note_response.json()

        review_response = await test_client.post(
            "/reviews/",
            json={"note_id": note["id"], "scheduled_at": str(date.today())},
        )
        assert review_response.status_code == 200

        default_response = await test_client.get(f"/notes/{note['id']}/")
        assert default_response.status_code == 200
        default_due_badge = next(
            badge
            for badge in default_response.json()["status_badges"]
            if badge["key"] == "due"
        )
        assert default_due_badge["label"] == "Due in 0d"

        client_today = date.today() - timedelta(days=1)
        client_date_response = await test_client.get(
            f"/notes/{note['id']}/",
            headers={"X-Client-Date": str(client_today)},
        )
        assert client_date_response.status_code == 200
        client_due_badge = next(
            badge
            for badge in client_date_response.json()["status_badges"]
            if badge["key"] == "due"
        )
        assert client_due_badge["label"] == "Due in 1d"
