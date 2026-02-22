"""Integration tests for note tree and reading endpoints."""

from httpx import AsyncClient


class TestNoteTree:
    async def test_root_and_parent_filters_with_cycle_guard(
        self,
        test_client: AsyncClient,
    ):
        parent_response = await test_client.post(
            "/notes/",
            json={"title": "Parent", "body": "", "tags": ["TOPIC"]},
        )
        assert parent_response.status_code == 201
        parent = parent_response.json()

        child_response = await test_client.post(
            "/notes/",
            json={
                "title": "Child",
                "body": "",
                "tags": ["TOPIC"],
                "parent_id": parent["id"],
            },
        )
        assert child_response.status_code == 201
        child = child_response.json()

        root_response = await test_client.get("/notes/?root=true")
        assert root_response.status_code == 200
        root_ids = {note["id"] for note in root_response.json()}
        assert parent["id"] in root_ids
        assert child["id"] not in root_ids

        children_response = await test_client.get(f"/notes/?parent_id={parent['id']}")
        assert children_response.status_code == 200
        child_ids = {note["id"] for note in children_response.json()}
        assert child["id"] in child_ids

        cycle_response = await test_client.patch(
            f"/notes/{parent['id']}/",
            json={"parent_id": child["id"]},
        )
        assert cycle_response.status_code == 400
        assert "cycle" in cycle_response.json()["detail"].lower()

    async def test_delete_parent_cascades_to_child(
        self,
        test_client: AsyncClient,
    ):
        parent_response = await test_client.post(
            "/notes/",
            json={"title": "Delete parent", "body": "", "tags": ["TOPIC"]},
        )
        assert parent_response.status_code == 201
        parent = parent_response.json()

        child_response = await test_client.post(
            "/notes/",
            json={
                "title": "Delete child",
                "body": "",
                "tags": ["TOPIC"],
                "parent_id": parent["id"],
            },
        )
        assert child_response.status_code == 201

        child = child_response.json()

        delete_response = await test_client.delete(f"/notes/{parent['id']}/")
        assert delete_response.status_code == 204

        parent_read = await test_client.get(f"/notes/{parent['id']}/")
        child_read = await test_client.get(f"/notes/{child['id']}/")
        assert parent_read.status_code == 404
        assert child_read.status_code == 200
        assert child_read.json()["parent_id"] is None


class TestNoteReading:
    async def test_reading_list_and_reading_update_endpoints(
        self,
        test_client: AsyncClient,
    ):
        create_response = await test_client.post(
            "/notes/",
            json={"title": "Reading note", "body": "", "tags": ["SOURCE"]},
        )
        assert create_response.status_code == 201
        note = create_response.json()

        list_update = await test_client.post(
            f"/notes/{note['id']}/reading-list/",
            json={"in_reading_list": True},
        )
        assert list_update.status_code == 200
        assert list_update.json()["in_reading_list"] is True

        reading_update = await test_client.post(
            f"/notes/{note['id']}/reading/",
            json={"reading_status": "ON_HOLD", "reading_notes": "Revisit later"},
        )
        assert reading_update.status_code == 200
        assert reading_update.json()["reading_status"] == "ON_HOLD"
        assert reading_update.json()["reading_notes"] == "Revisit later"

        filtered = await test_client.get(
            "/notes/?in_reading_list=true&reading_status=ON_HOLD"
        )
        assert filtered.status_code == 200
        ids = {item["id"] for item in filtered.json()}
        assert note["id"] in ids
