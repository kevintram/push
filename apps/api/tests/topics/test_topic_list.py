"""Integration tests for topic listing behavior."""

from httpx import AsyncClient


async def _create_topic(
    test_client: AsyncClient,
    *,
    title: str,
    parent_id: int | None = None,
) -> dict:
    payload: dict[str, int | str | None] = {"title": title, "body": ""}
    if parent_id is not None:
        payload["parent_id"] = parent_id

    response = await test_client.post("/topics/", json=payload)
    assert response.status_code == 201
    return response.json()


class TestTopicList:
    async def test_list_topics_can_sort_roots_alphabetically(
        self,
        test_client: AsyncClient,
    ):
        alpha = await _create_topic(test_client, title="alpha")
        root = await _create_topic(test_client, title="Gamma")
        untitled = await _create_topic(test_client, title="")
        _ = await _create_topic(test_client, title="child", parent_id=root["id"])

        response = await test_client.get("/topics/?root=true&sort=title&order=asc")

        assert response.status_code == 200
        payload = response.json()
        assert [topic["id"] for topic in payload] == [
            alpha["id"],
            root["id"],
            untitled["id"],
        ]
