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


async def _update_topic(
    test_client: AsyncClient,
    topic_id: int,
    *,
    parent_id: int | None = None,
) -> dict:
    response = await test_client.patch(
        f"/topics/{topic_id}/",
        json={"parent_id": parent_id},
    )
    assert response.status_code == 200
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

    async def test_list_topics_can_filter_to_a_subtree(
        self,
        test_client: AsyncClient,
    ):
        root = await _create_topic(test_client, title="Mathematics")
        branch = await _create_topic(
            test_client,
            title="Algebra",
            parent_id=root["id"],
        )
        leaf = await _create_topic(
            test_client,
            title="Linear equations",
            parent_id=branch["id"],
        )
        _outside = await _create_topic(test_client, title="Geometry")

        response = await test_client.get(
            f"/topics/?subtree_of={root['id']}&sort=title&order=asc"
        )

        assert response.status_code == 200
        payload = response.json()
        assert [topic["id"] for topic in payload] == [
            branch["id"],
            leaf["id"],
            root["id"],
        ]

    async def test_list_topics_returns_descendants_after_reparenting_branch(
        self,
        test_client: AsyncClient,
    ):
        original_root = await _create_topic(test_client, title="Computer Science")
        branch = await _create_topic(
            test_client,
            title="Backend Engineering",
            parent_id=original_root["id"],
        )
        leaf = await _create_topic(
            test_client,
            title="Databases",
            parent_id=branch["id"],
        )
        new_root = await _create_topic(test_client, title="Mathematics")

        moved_root = await _update_topic(
            test_client,
            original_root["id"],
            parent_id=new_root["id"],
        )

        subtree_response = await test_client.get(
            f"/topics/?subtree_of={moved_root['id']}&sort=title&order=asc"
        )

        assert subtree_response.status_code == 200
        subtree_payload = subtree_response.json()
        assert [topic["id"] for topic in subtree_payload] == [
            branch["id"],
            original_root["id"],
            leaf["id"],
        ]
