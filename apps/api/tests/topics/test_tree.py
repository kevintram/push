"""Integration tests for topics tree/hierarchy endpoints."""

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Topic


class TestTopicTreeBasics:
    """Tests for basic parent/child relationships."""

    async def test_create_topic_with_parent(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Create a topic with a parent_id."""
        parent = await create_test_topic(name="Parent Topic")

        response = await test_client.post(
            "/topics/",
            json={
                "name": "Child Topic",
                "parent_id": parent.id,
                "srs_enabled": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Child Topic"
        assert data["parent_id"] == parent.id

    async def test_path_computed_by_trigger(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """Database trigger should compute ltree path correctly."""
        parent = await create_test_topic(name="Parent")

        response = await test_client.post(
            "/topics/",
            json={
                "name": "Child",
                "parent_id": parent.id,
                "srs_enabled": True,
            },
        )
        child_id = response.json()["id"]

        # Fetch from DB to verify trigger-computed path
        result = await db_session.execute(select(Topic).where(Topic.id == child_id))
        child = result.scalar_one()

        # Path should be parent.path + child.id (ltree format)
        assert child.path is not None
        assert str(parent.id) in str(child.path)
        assert str(child_id) in str(child.path)

    async def test_get_topic_children(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """GET /topics/{id}/children/ should return direct children."""
        parent = await create_test_topic(name="Parent")
        await create_test_topic(name="Child 1", parent_id=parent.id)
        await create_test_topic(name="Child 2", parent_id=parent.id)
        # Grandchild should NOT be returned (not direct child)
        child1 = await create_test_topic(name="Child 1 Again", parent_id=parent.id)
        await create_test_topic(name="Grandchild", parent_id=child1.id)

        response = await test_client.get(f"/topics/{parent.id}/children/")

        assert response.status_code == 200
        children = response.json()
        assert len(children) == 3
        child_names = {c["name"] for c in children}
        assert "Child 1" in child_names
        assert "Child 2" in child_names
        assert "Grandchild" not in child_names

    async def test_add_existing_topic_as_child(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """POST /topics/{parent_id}/children/ with existing topic."""
        parent = await create_test_topic(name="Parent")
        orphan = await create_test_topic(name="Orphan")

        response = await test_client.post(
            f"/topics/{parent.id}/children/",
            json={"child_id": orphan.id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["child"]["id"] == orphan.id
        assert data["child"]["parent_id"] == parent.id

    async def test_add_new_topic_as_child(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """POST /topics/{parent_id}/children/ with inline topic creation."""
        parent = await create_test_topic(name="Parent")

        response = await test_client.post(
            f"/topics/{parent.id}/children/",
            json={
                "child": {
                    "name": "New Child",
                    "notes": "Created inline",
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["child"]["name"] == "New Child"
        assert data["child"]["parent_id"] == parent.id

    async def test_set_parent_with_existing_topic(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """POST /topics/{id}/parent/ with existing topic as parent."""
        child = await create_test_topic(name="Child")
        parent = await create_test_topic(name="Parent")

        response = await test_client.post(
            f"/topics/{child.id}/parent/",
            json={"parent_id": parent.id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["parent"]["id"] == parent.id
        assert data["child"]["id"] == child.id
        assert data["child"]["parent_id"] == parent.id

    async def test_set_parent_with_inline_create(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """POST /topics/{id}/parent/ with inline parent creation."""
        child = await create_test_topic(name="Child")

        response = await test_client.post(
            f"/topics/{child.id}/parent/",
            json={"parent": {"name": "New Parent"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["parent"]["name"] == "New Parent"
        assert data["parent"]["id"] is not None
        assert data["child"]["id"] == child.id
        assert data["child"]["parent_id"] == data["parent"]["id"]

    async def test_set_parent_self_reference_rejected(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """POST /topics/{id}/parent/ with self as parent should fail."""
        topic = await create_test_topic(name="Topic")

        response = await test_client.post(
            f"/topics/{topic.id}/parent/",
            json={"parent_id": topic.id},
        )

        assert response.status_code == 400

    async def test_remove_child_from_parent(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """DELETE /topics/{parent_id}/children/{child_id}/ orphans the child."""
        parent = await create_test_topic(name="Parent")
        child = await create_test_topic(name="Child", parent_id=parent.id)

        response = await test_client.delete(f"/topics/{parent.id}/children/{child.id}/")

        assert response.status_code == 200

        # Verify child is orphaned (parent_id = null)
        result = await db_session.execute(select(Topic).where(Topic.id == child.id))
        orphaned_child = result.scalar_one()
        assert orphaned_child.parent_id is None


class TestTopicCycleDetection:
    """Tests for cycle prevention in topic hierarchy."""

    async def test_cannot_set_self_as_parent(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Topic cannot be its own parent."""
        topic = await create_test_topic(name="Topic")

        response = await test_client.patch(
            f"/topics/{topic.id}/",
            json={"parent_id": topic.id},
        )

        assert response.status_code == 409
        assert "cycle" in response.json()["detail"].lower()

    async def test_cannot_set_descendant_as_parent(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Cannot set a descendant as parent (would create cycle)."""
        grandparent = await create_test_topic(name="Grandparent")
        parent = await create_test_topic(name="Parent", parent_id=grandparent.id)
        child = await create_test_topic(name="Child", parent_id=parent.id)

        # Try to set child as grandparent's parent
        response = await test_client.patch(
            f"/topics/{grandparent.id}/",
            json={"parent_id": child.id},
        )

        assert response.status_code == 409
        assert "cycle" in response.json()["detail"].lower()

    async def test_cannot_add_ancestor_as_child(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Cannot add an ancestor as a child (would create cycle)."""
        grandparent = await create_test_topic(name="Grandparent")
        parent = await create_test_topic(name="Parent", parent_id=grandparent.id)
        child = await create_test_topic(name="Child", parent_id=parent.id)

        # Try to add grandparent as child of child
        response = await test_client.post(
            f"/topics/{child.id}/children/",
            json={"child_id": grandparent.id},
        )

        assert response.status_code == 409
        assert "cycle" in response.json()["detail"].lower()

    async def test_can_reparent_to_non_descendant(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Can change parent to a non-descendant topic."""
        parent1 = await create_test_topic(name="Parent 1")
        parent2 = await create_test_topic(name="Parent 2")
        child = await create_test_topic(name="Child", parent_id=parent1.id)

        response = await test_client.patch(
            f"/topics/{child.id}/",
            json={"parent_id": parent2.id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["parent_id"] == parent2.id


class TestTopicDeleteWithChildren:
    """Tests for delete strategies when topic has children."""

    async def test_delete_topic_with_children_requires_strategy(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Deleting topic with children without strategy should fail."""
        parent = await create_test_topic(name="Parent")
        await create_test_topic(name="Child", parent_id=parent.id)

        response = await test_client.delete(f"/topics/{parent.id}/")

        assert response.status_code == 409
        assert "children" in response.json()["detail"].lower()

    async def test_delete_strategy_delete_removes_descendants(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """handle_children_by=delete removes all descendants."""
        grandparent = await create_test_topic(name="Grandparent")
        parent = await create_test_topic(name="Parent", parent_id=grandparent.id)
        child = await create_test_topic(name="Child", parent_id=parent.id)

        response = await test_client.delete(
            f"/topics/{grandparent.id}/?handle_children_by=delete"
        )

        assert response.status_code == 200

        # Verify all descendants deleted
        for topic_id in [grandparent.id, parent.id, child.id]:
            result = await db_session.execute(select(Topic).where(Topic.id == topic_id))
            assert result.scalar_one_or_none() is None

    async def test_delete_strategy_orphan_makes_children_root(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """handle_children_by=orphan sets children's parent_id to null."""
        parent = await create_test_topic(name="Parent")
        child1 = await create_test_topic(name="Child 1", parent_id=parent.id)
        child2 = await create_test_topic(name="Child 2", parent_id=parent.id)

        response = await test_client.delete(
            f"/topics/{parent.id}/?handle_children_by=orphan"
        )

        assert response.status_code == 200

        # Verify children are now root topics
        for child_id in [child1.id, child2.id]:
            result = await db_session.execute(select(Topic).where(Topic.id == child_id))
            orphaned = result.scalar_one()
            assert orphaned.parent_id is None

    async def test_delete_strategy_reparent_moves_to_grandparent(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """handle_children_by=reparent moves children to grandparent."""
        grandparent = await create_test_topic(name="Grandparent")
        parent = await create_test_topic(name="Parent", parent_id=grandparent.id)
        child = await create_test_topic(name="Child", parent_id=parent.id)

        response = await test_client.delete(
            f"/topics/{parent.id}/?handle_children_by=reparent"
        )

        assert response.status_code == 200

        # Verify child now belongs to grandparent
        result = await db_session.execute(select(Topic).where(Topic.id == child.id))
        reparented = result.scalar_one()
        assert reparented.parent_id == grandparent.id

    async def test_delete_reparent_fails_for_root_topic(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Cannot use reparent strategy on root topic (no grandparent)."""
        root = await create_test_topic(name="Root")
        await create_test_topic(name="Child", parent_id=root.id)

        response = await test_client.delete(
            f"/topics/{root.id}/?handle_children_by=reparent"
        )

        assert response.status_code == 400
        assert "root" in response.json()["detail"].lower()


class TestTopicTreeFiltering:
    """Tests for tree-aware topic filtering."""

    async def test_list_root_topics_only(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """GET /topics/?root=true returns only root topics."""
        root1 = await create_test_topic(name="Root 1")
        await create_test_topic(name="Root 2")
        await create_test_topic(name="Child", parent_id=root1.id)

        response = await test_client.get("/topics/?root=true")

        assert response.status_code == 200
        topics = response.json()
        assert len(topics) == 2
        topic_names = {t["name"] for t in topics}
        assert topic_names == {"Root 1", "Root 2"}

    async def test_addable_as_parent_excludes_self_and_current_parent(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """addable_as_parent_to filter excludes self and current parent.

        When selecting a new parent for a topic, the filter excludes:
        - The topic itself (can't be its own parent)
        - The current parent (already the parent)
        - All descendants (to prevent cycles) - via ltree path containment
        """
        grandparent = await create_test_topic(name="Grandparent")
        parent = await create_test_topic(name="Parent", parent_id=grandparent.id)
        child = await create_test_topic(name="Child", parent_id=parent.id)
        unrelated = await create_test_topic(name="Unrelated")

        response = await test_client.get(
            f"/topics/search/?addable_as_parent_to={parent.id}"
        )

        assert response.status_code == 200
        topics = response.json()
        topic_ids = {t["id"] for t in topics}

        # Should include unrelated (not in the hierarchy path)
        assert unrelated.id in topic_ids
        # Parent itself is excluded (via descendants query which includes self)
        assert parent.id not in topic_ids
        # Grandparent is excluded (current parent)
        assert grandparent.id not in topic_ids
        # Child is excluded (descendant - would create cycle if set as parent)
        assert child.id not in topic_ids

    async def test_addable_as_child_excludes_self_and_current_children(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """addable_as_child_to filter excludes self, ancestors, and current children.

        When selecting a new child for a topic, the filter excludes:
        - The topic itself (can't be its own child)
        - All ancestors (to prevent cycles) - via ltree path containment
        - Current children (already children)
        """
        grandparent = await create_test_topic(name="Grandparent")
        parent = await create_test_topic(name="Parent", parent_id=grandparent.id)
        child = await create_test_topic(name="Child", parent_id=parent.id)
        unrelated = await create_test_topic(name="Unrelated")

        response = await test_client.get(
            f"/topics/search/?addable_as_child_to={parent.id}"
        )

        assert response.status_code == 200
        topics = response.json()
        topic_ids = {t["id"] for t in topics}

        # Should include unrelated (not in the hierarchy path)
        assert unrelated.id in topic_ids
        # Parent itself is excluded (via ancestors query which includes self)
        assert parent.id not in topic_ids
        # Child is excluded (already a child)
        assert child.id not in topic_ids


class TestTopicInlineCreate:
    """Tests for inline entity creation on topic endpoints."""

    async def test_add_practice_to_topic_inline_create(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """POST /topics/{id}/practices/ with inline practice creation."""
        topic = await create_test_topic(name="Topic")

        response = await test_client.post(
            f"/topics/{topic.id}/practices/",
            json={"practice": {"prompt": "Inline Practice", "answer": "Answer"}},
        )

        assert response.status_code == 201

        # Verify practice was created and linked
        get_response = await test_client.get(f"/topics/{topic.id}/practices/")
        assert get_response.status_code == 200
        practices = get_response.json()
        assert len(practices) == 1
        assert practices[0]["prompt"] == "Inline Practice"

    async def test_add_source_to_topic_with_existing_id(
        self,
        test_client: AsyncClient,
        create_test_topic,
        create_test_source,
    ):
        """POST /topics/{id}/sources/ with existing source_id."""
        topic = await create_test_topic(name="Topic")
        source = await create_test_source(title="Existing Source")

        response = await test_client.post(
            f"/topics/{topic.id}/sources/",
            json={"source_id": source.id},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["topic"]["id"] == topic.id
        assert data["source"]["id"] == source.id

    async def test_add_source_to_topic_inline_create(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """POST /topics/{id}/sources/ with inline source creation."""
        topic = await create_test_topic(name="Topic")

        response = await test_client.post(
            f"/topics/{topic.id}/sources/",
            json={"source": {"title": "Inline Source"}},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["topic"]["id"] == topic.id
        assert data["source"]["title"] == "Inline Source"
        assert data["source"]["id"] is not None

    async def test_add_child_with_inboxed_and_archived(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """POST /topics/{id}/children/ inline creation respects inboxed/archived."""
        parent = await create_test_topic(name="Parent")

        response = await test_client.post(
            f"/topics/{parent.id}/children/",
            json={
                "child": {
                    "name": "Inboxed Child",
                    "inboxed": True,
                    "archived": True,
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["child"]["name"] == "Inboxed Child"
        assert data["child"]["inboxed"] is True
        assert data["child"]["archived"] is True
        assert data["child"]["parent_id"] == parent.id


class TestTopicChildrenIncludeParent:
    async def test_topic_children_include_parent(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        parent = await create_test_topic(name="Topic Parent")
        child = await create_test_topic(name="Topic Child", parent_id=parent.id)

        response = await test_client.get(f"/topics/{parent.id}/children/")
        assert response.status_code == 200
        child_payload = next(item for item in response.json() if item["id"] == child.id)
        assert child_payload["parent"]["id"] == parent.id
