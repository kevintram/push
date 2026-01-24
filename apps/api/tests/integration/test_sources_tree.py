"""Integration tests for sources tree/hierarchy endpoints."""

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Source


class TestSourceTreeBasics:
    """Tests for basic parent/child relationships."""

    async def test_create_source_with_parent(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Create a source with a parent_id."""
        parent = await create_test_source(title="Parent Source")

        response = await test_client.post(
            "/sources/",
            json={
                "title": "Child Source",
                "parent_id": parent.id,
                "srs_enabled": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Child Source"
        assert data["parent_id"] == parent.id

    async def test_path_computed_by_trigger(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """Database trigger should compute ltree path correctly."""
        parent = await create_test_source(title="Parent")

        response = await test_client.post(
            "/sources/",
            json={
                "title": "Child",
                "parent_id": parent.id,
                "srs_enabled": True,
            },
        )
        child_id = response.json()["id"]

        # Fetch from DB to verify trigger-computed path
        result = await db_session.execute(select(Source).where(Source.id == child_id))
        child = result.scalar_one()

        # Path should be parent.path + child.id (ltree format)
        assert child.path is not None
        assert str(parent.id) in str(child.path)
        assert str(child_id) in str(child.path)

    async def test_get_source_children(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """GET /sources/{id}/children/ should return direct children."""
        parent = await create_test_source(title="Parent")
        await create_test_source(title="Child 1", parent_id=parent.id)
        await create_test_source(title="Child 2", parent_id=parent.id)
        # Grandchild should NOT be returned (not direct child)
        child1 = await create_test_source(title="Child 1 Again", parent_id=parent.id)
        await create_test_source(title="Grandchild", parent_id=child1.id)

        response = await test_client.get(f"/sources/{parent.id}/children/")

        assert response.status_code == 200
        children = response.json()
        assert len(children) == 3
        child_titles = {c["title"] for c in children}
        assert "Child 1" in child_titles
        assert "Child 2" in child_titles
        assert "Grandchild" not in child_titles

    async def test_add_existing_source_as_child(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """POST /sources/{parent_id}/children/ with existing source."""
        parent = await create_test_source(title="Parent")
        orphan = await create_test_source(title="Orphan")

        response = await test_client.post(
            f"/sources/{parent.id}/children/",
            json={"child_id": orphan.id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["child"]["id"] == orphan.id
        assert data["child"]["parent_id"] == parent.id

    async def test_add_new_source_as_child(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """POST /sources/{parent_id}/children/ with inline source creation."""
        parent = await create_test_source(title="Parent")

        response = await test_client.post(
            f"/sources/{parent.id}/children/",
            json={
                "child": {
                    "title": "New Child",
                    "notes": "Created inline",
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["child"]["title"] == "New Child"
        assert data["child"]["parent_id"] == parent.id

    async def test_remove_child_from_parent(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """DELETE /sources/{parent_id}/children/{child_id}/ orphans the child."""
        parent = await create_test_source(title="Parent")
        child = await create_test_source(title="Child", parent_id=parent.id)

        response = await test_client.delete(
            f"/sources/{parent.id}/children/{child.id}/"
        )

        assert response.status_code == 200

        # Verify child is orphaned (parent_id = null)
        result = await db_session.execute(select(Source).where(Source.id == child.id))
        orphaned_child = result.scalar_one()
        assert orphaned_child.parent_id is None


class TestSourceCycleDetection:
    """Tests for cycle prevention in source hierarchy."""

    async def test_cannot_set_self_as_parent(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Source cannot be its own parent."""
        source = await create_test_source(title="Source")

        response = await test_client.patch(
            f"/sources/{source.id}/",
            json={"parent_id": source.id},
        )

        assert response.status_code == 409
        assert "cycle" in response.json()["detail"].lower()

    async def test_cannot_set_descendant_as_parent(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Cannot set a descendant as parent (would create cycle)."""
        grandparent = await create_test_source(title="Grandparent")
        parent = await create_test_source(title="Parent", parent_id=grandparent.id)
        child = await create_test_source(title="Child", parent_id=parent.id)

        # Try to set child as grandparent's parent
        response = await test_client.patch(
            f"/sources/{grandparent.id}/",
            json={"parent_id": child.id},
        )

        assert response.status_code == 409
        assert "cycle" in response.json()["detail"].lower()

    async def test_cannot_add_ancestor_as_child(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Cannot add an ancestor as a child (would create cycle)."""
        grandparent = await create_test_source(title="Grandparent")
        parent = await create_test_source(title="Parent", parent_id=grandparent.id)
        child = await create_test_source(title="Child", parent_id=parent.id)

        # Try to add grandparent as child of child
        response = await test_client.post(
            f"/sources/{child.id}/children/",
            json={"child_id": grandparent.id},
        )

        assert response.status_code == 409
        assert "cycle" in response.json()["detail"].lower()

    async def test_can_reparent_to_non_descendant(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Can change parent to a non-descendant source."""
        parent1 = await create_test_source(title="Parent 1")
        parent2 = await create_test_source(title="Parent 2")
        child = await create_test_source(title="Child", parent_id=parent1.id)

        response = await test_client.patch(
            f"/sources/{child.id}/",
            json={"parent_id": parent2.id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["parent_id"] == parent2.id


class TestSourceDeleteWithChildren:
    """Tests for delete strategies when source has children."""

    async def test_delete_source_with_children_requires_strategy(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Deleting source with children without strategy should fail."""
        parent = await create_test_source(title="Parent")
        await create_test_source(title="Child", parent_id=parent.id)

        response = await test_client.delete(f"/sources/{parent.id}/")

        assert response.status_code == 409
        assert "children" in response.json()["detail"].lower()

    async def test_delete_strategy_delete_removes_descendants(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """handle_children_by=delete removes all descendants."""
        grandparent = await create_test_source(title="Grandparent")
        parent = await create_test_source(title="Parent", parent_id=grandparent.id)
        child = await create_test_source(title="Child", parent_id=parent.id)

        response = await test_client.delete(
            f"/sources/{grandparent.id}/?handle_children_by=delete"
        )

        assert response.status_code == 200

        # Verify all descendants deleted
        for source_id in [grandparent.id, parent.id, child.id]:
            result = await db_session.execute(
                select(Source).where(Source.id == source_id)
            )
            assert result.scalar_one_or_none() is None

    async def test_delete_strategy_orphan_makes_children_root(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """handle_children_by=orphan sets children's parent_id to null."""
        parent = await create_test_source(title="Parent")
        child1 = await create_test_source(title="Child 1", parent_id=parent.id)
        child2 = await create_test_source(title="Child 2", parent_id=parent.id)

        response = await test_client.delete(
            f"/sources/{parent.id}/?handle_children_by=orphan"
        )

        assert response.status_code == 200

        # Verify children are now root sources
        for child_id in [child1.id, child2.id]:
            result = await db_session.execute(
                select(Source).where(Source.id == child_id)
            )
            orphaned = result.scalar_one()
            assert orphaned.parent_id is None

    async def test_delete_strategy_reparent_moves_to_grandparent(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """handle_children_by=reparent moves children to grandparent."""
        grandparent = await create_test_source(title="Grandparent")
        parent = await create_test_source(title="Parent", parent_id=grandparent.id)
        child = await create_test_source(title="Child", parent_id=parent.id)

        response = await test_client.delete(
            f"/sources/{parent.id}/?handle_children_by=reparent"
        )

        assert response.status_code == 200

        # Verify child now belongs to grandparent
        result = await db_session.execute(select(Source).where(Source.id == child.id))
        reparented = result.scalar_one()
        assert reparented.parent_id == grandparent.id

    async def test_delete_reparent_fails_for_root_source(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Cannot use reparent strategy on root source (no grandparent)."""
        root = await create_test_source(title="Root")
        await create_test_source(title="Child", parent_id=root.id)

        response = await test_client.delete(
            f"/sources/{root.id}/?handle_children_by=reparent"
        )

        assert response.status_code == 400
        assert "root" in response.json()["detail"].lower()


class TestSourceTreeFiltering:
    """Tests for tree-aware source filtering."""

    async def test_list_root_sources_only(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """GET /sources/?root=true returns only root sources."""
        root1 = await create_test_source(title="Root 1")
        await create_test_source(title="Root 2")
        await create_test_source(title="Child", parent_id=root1.id)

        response = await test_client.get("/sources/?root=true")

        assert response.status_code == 200
        sources = response.json()
        assert len(sources) == 2
        source_titles = {s["title"] for s in sources}
        assert source_titles == {"Root 1", "Root 2"}

    async def test_addable_as_parent_excludes_self_and_current_parent(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """addable_as_parent_to filter excludes self and current parent.

        When selecting a new parent for a source, the filter excludes:
        - The source itself (can't be its own parent)
        - The current parent (already the parent)
        - All descendants (to prevent cycles) - via ltree path containment
        """
        grandparent = await create_test_source(title="Grandparent")
        parent = await create_test_source(title="Parent", parent_id=grandparent.id)
        await create_test_source(title="Child", parent_id=parent.id)
        unrelated = await create_test_source(title="Unrelated")

        response = await test_client.get(
            f"/sources/search/?addable_as_parent_to={parent.id}"
        )

        assert response.status_code == 200
        sources = response.json()
        source_ids = {s["id"] for s in sources}

        # Should include unrelated (not in the hierarchy path)
        assert unrelated.id in source_ids
        # Parent itself is excluded (via descendants query which includes self)
        assert parent.id not in source_ids
        # Grandparent is excluded (current parent)
        assert grandparent.id not in source_ids

    async def test_addable_as_child_excludes_self_and_current_children(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """addable_as_child_to filter excludes self, ancestors, and current children.

        When selecting a new child for a source, the filter excludes:
        - The source itself (can't be its own child)
        - All ancestors (to prevent cycles) - via ltree path containment
        - Current children (already children)
        """
        grandparent = await create_test_source(title="Grandparent")
        parent = await create_test_source(title="Parent", parent_id=grandparent.id)
        child = await create_test_source(title="Child", parent_id=parent.id)
        unrelated = await create_test_source(title="Unrelated")

        response = await test_client.get(
            f"/sources/search/?addable_as_child_to={parent.id}"
        )

        assert response.status_code == 200
        sources = response.json()
        source_ids = {s["id"] for s in sources}

        # Should include unrelated (not in the hierarchy path)
        assert unrelated.id in source_ids
        # Parent itself is excluded (via ancestors query which includes self)
        assert parent.id not in source_ids
        # Child is excluded (already a child)
        assert child.id not in source_ids
