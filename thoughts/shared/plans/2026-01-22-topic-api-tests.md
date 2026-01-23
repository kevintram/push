# API Integration Tests Implementation Plan

## Overview

Implement integration tests for the FastAPI backend API using Docker/Testcontainers for real PostgreSQL. Priority areas: Topics CRUD, Reviews/FSRS endpoints, and Sources CRUD. Tests will verify full HTTP request/response cycles with actual database interactions.

## Current State Analysis

### Existing Test Infrastructure
- **pytest config**: Already configured in `pyproject.toml:26-29` with `asyncio_mode = "auto"`, `pythonpath = ["."]`, `testpaths = ["tests"]`
- **Dev dependencies**: `pytest>=9.0.1`, `pytest-asyncio>=1.3.0`, `pytest-md>=0.2.0`
- **One existing test file**: `tests/routers/test_topics.py` with 3 unit tests for `search_topics()`

### Key Endpoints to Test

1. **Topics Router** (`app/routers/topics.py`)
   - CRUD operations (create, read, update, delete)
   - List/search with filtering
   - Tree operations (parent/child, ltree path computation, cycle detection)

2. **Reviews Router** (`app/routers/reviews.py`)
   - `create_review()` - HTTP endpoint with polymorphic handling (topic vs source)
   - `update_review()` - HTTP endpoint with FSRS recalculation
   - `delete_review()` - HTTP endpoint with replay
   - List/filter reviews

3. **Sources Router** (`app/routers/sources.py`)
   - CRUD operations similar to topics
   - Source-topic associations
   - Tree operations (parent/child, ltree path computation, cycle detection)

## Desired End State

- **Integration tests** covering HTTP endpoints with real PostgreSQL via Testcontainers
- **Shared fixtures** centralized in `conftest.py` files:
  - `tests/conftest.py`: Database container, migrations, session fixtures
  - `tests/integration/conftest.py`: HTTP client, `mock_user_id`, entity factories
- **CI-ready**: Tests run in GitHub Actions via `uv run pytest` with dependency caching

### Verification Methods
- `uv run pytest tests/integration/ -v` passes with no failures
- Tests run in CI without manual database setup

## What We're NOT Doing

- **NOT testing auth/login flow**: WorkOS integration requires external service
- **NOT testing admin endpoints**: Simple protected routes with low complexity
- **NOT testing database migrations**: Handled separately by Supabase
- **NOT writing unit tests**: This plan focuses exclusively on integration tests

## Implementation Approach

Set up Testcontainers infrastructure first, then add integration tests for each router incrementally. Each phase is independently valuable and deployable.

---

## Phase 1: Integration Test Infrastructure

### Overview
Set up the integration test infrastructure with Testcontainers and create all shared fixtures. This includes database setup, HTTP test client, authentication mocking (`mock_user_id`), and entity factory fixtures (`create_test_topic`, `create_test_source`).

### Changes Required

#### 1. Add Testcontainers dependency
**File**: `apps/api/pyproject.toml`
**Changes**: Add testcontainers, httpx, and pytest-cov to dev dependencies

```toml
[dependency-groups]
dev = [
    "pytest>=9.0.1",
    "pytest-asyncio>=1.3.0",
    "pytest-md>=0.2.0",
    "pytest-cov>=4.1.0",
    "testcontainers[postgres]>=4.0.0",
    "httpx>=0.27.0",
    "psycopg2-binary>=2.9.9",
]
```

**Rationale**: testcontainers-postgres for integration tests, httpx for FastAPI TestClient async support, psycopg2-binary for running migrations synchronously, pytest-cov for coverage reporting.

#### 2. Update pytest configuration for async support
**File**: `apps/api/pyproject.toml` (update existing pytest config)

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "session"
pythonpath = ["."]
testpaths = ["tests"]
```

**Rationale**: Modern pytest-asyncio configuration. The `asyncio_default_fixture_loop_scope = "session"` replaces the deprecated `event_loop` fixture pattern. With `asyncio_mode = "auto"`, the `@pytest.mark.asyncio` decorator is not needed on individual tests.

#### 3. Add Supabase-only flags to migrations
**Files**: All files in `supabase/migrations/*.sql`
**Changes**: Wrap Supabase-specific SQL with comment flags

```sql
-- @supabase-only-start
GRANT SELECT ON table_name TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
-- @supabase-only-end
```

**Rationale**: Supabase-specific SQL will fail when applied to the test (vanilla postgres) database, so we will skip them using these flags when creating the test database. 

#### 4. Create shared test fixtures
**File**: `apps/api/tests/conftest.py`

```python
"""Shared test fixtures for integration tests."""
from __future__ import annotations

import re
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from sqlalchemy import NullPool, make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


def filter_migration_sql(sql: str) -> str:
    """Filter out Supabase-specific SQL wrapped in @supabase-only flags.

    Migrations should wrap Supabase-specific SQL like this:
        -- @supabase-only-start
        GRANT SELECT ON table_name TO anon;
        -- @supabase-only-end
    """
    # Remove content between @supabase-only-start and @supabase-only-end
    pattern = r'--\s*@supabase-only-start.*?--\s*@supabase-only-end'
    return re.sub(pattern, '', sql, flags=re.DOTALL | re.IGNORECASE)


@pytest.fixture(scope="session")
def postgres_container():
    """Start a PostgreSQL container for integration tests."""
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("postgres:16-alpine") as postgres:
        yield postgres


@pytest.fixture(scope="session")
def database_url(postgres_container) -> str:
    """Get the async database URL for the test container."""
    url = make_url(postgres_container.get_connection_url())
    return str(url.set(drivername="postgresql+asyncpg"))


@pytest.fixture(scope="session")
def sync_database_url(postgres_container) -> str:
    """Get the sync database URL for running migrations."""
    return postgres_container.get_connection_url()


@pytest.fixture(scope="session")
async def async_engine(database_url):
    """Create an async engine for the test database."""
    engine = create_async_engine(
        database_url,
        echo=False,
        poolclass=NullPool,
    )
    yield engine
    await engine.dispose()


# Known Supabase-specific error patterns that are safe to ignore
# These occur when migrations reference Supabase features not in vanilla PostgreSQL
SUPABASE_ERROR_PATTERNS = [
    "role \"anon\" does not exist",
    "role \"authenticated\" does not exist",
    "role \"service_role\" does not exist",
    "schema \"auth\" does not exist",
    "extension \"pg_graphql\" is not available",
    "extension \"pgsodium\" is not available",
    "function auth.",
    "policy",  # RLS policies reference Supabase roles
]


def is_expected_supabase_error(error_msg: str) -> bool:
    """Check if an error is a known Supabase-specific failure."""
    error_lower = error_msg.lower()
    return any(pattern.lower() in error_lower for pattern in SUPABASE_ERROR_PATTERNS)


@pytest.fixture(scope="session")
def setup_database(sync_database_url):
    """Run migrations to set up database schema.

    Uses actual migration files to ensure tests run against the same
    schema as production, including triggers and functions.

    Raises RuntimeError if any unexpected migration errors occur.
    """
    import psycopg2

    # Find migrations directory (relative to this file)
    migrations_dir = Path(__file__).parent.parent.parent.parent.parent / "supabase" / "migrations"

    if not migrations_dir.exists():
        raise RuntimeError(f"Migrations directory not found: {migrations_dir}")

    # Get all migration files sorted by name (timestamp prefix ensures order)
    migration_files = sorted(migrations_dir.glob("*.sql"))

    # Track errors for reporting
    expected_errors: list[tuple[str, str]] = []  # (filename, error_msg)
    unexpected_errors: list[tuple[str, str]] = []  # (filename, error_msg)

    # Connect and run migrations
    conn = psycopg2.connect(sync_database_url)
    conn.autocommit = True
    cursor = conn.cursor()

    try:
        # Create ltree extension first (required by migrations)
        cursor.execute("CREATE EXTENSION IF NOT EXISTS ltree")

        for migration_file in migration_files:
            sql = migration_file.read_text()
            filtered_sql = filter_migration_sql(sql)

            if filtered_sql.strip():
                try:
                    cursor.execute(filtered_sql)
                except psycopg2.Error as e:
                    error_msg = str(e).strip()
                    if is_expected_supabase_error(error_msg):
                        expected_errors.append((migration_file.name, error_msg))
                    else:
                        unexpected_errors.append((migration_file.name, error_msg))
    finally:
        cursor.close()
        conn.close()

    # Report expected errors (for visibility, not failures)
    if expected_errors:
        print(f"\n[setup_database] Skipped {len(expected_errors)} Supabase-specific statements:")
        for filename, msg in expected_errors[:5]:  # Show first 5
            print(f"  - {filename}: {msg[:80]}...")
        if len(expected_errors) > 5:
            print(f"  ... and {len(expected_errors) - 5} more")

    # Fail on unexpected errors
    if unexpected_errors:
        error_report = "\n".join(
            f"  - {filename}: {msg}" for filename, msg in unexpected_errors
        )
        raise RuntimeError(
            f"Migration failed with {len(unexpected_errors)} unexpected error(s):\n"
            f"{error_report}\n\n"
            "If this is a Supabase-specific statement, either:\n"
            "1. Wrap it with -- @supabase-only-start / -- @supabase-only-end\n"
            "2. Add the error pattern to SUPABASE_ERROR_PATTERNS in conftest.py"
        )

    yield

    # No teardown needed - container is destroyed after tests


@pytest.fixture
async def db_session(async_engine, setup_database) -> AsyncGenerator[AsyncSession, None]:
    """Create a database session for each test with proper isolation.

    Uses nested transactions (savepoints) to ensure each test starts with
    a clean database state. The outer transaction is never committed, so
    all changes are rolled back after each test.
    """
    async with async_engine.connect() as conn:
        # Start outer transaction (will be rolled back)
        await conn.begin()
        # Create savepoint for test isolation
        await conn.begin_nested()

        async_session = async_sessionmaker(
            bind=conn,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        async with async_session() as session:
            yield session

        # Roll back to before the savepoint (discards all test changes)
        await conn.rollback()
```

**Rationale**: Running actual migrations ensures tests use the same schema as production, including triggers and functions. The nested transaction (savepoint) pattern ensures test isolation even when endpoints commit—the outer transaction is rolled back after each test, discarding all changes. The `@supabase-only` flags provide explicit, reliable filtering of Supabase-specific SQL. The error handling distinguishes between expected Supabase-specific failures (roles, extensions, policies) and real bugs—expected errors are logged for visibility while unexpected errors fail fast with actionable guidance.

#### 5. Create integration test directory and conftest
**File**: `apps/api/tests/integration/__init__.py`
```python
```

**File**: `apps/api/tests/integration/conftest.py`

```python
"""Integration test fixtures specific to HTTP testing."""
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.main import app
from app.dependencies import get_db, get_user_id
from app.models import Topic, Source, FsrsState


# Default test user ID used by mock_user_id fixture
DEFAULT_TEST_USER_ID = "test-user-123"


@pytest.fixture
def mock_user_id():
    """Return the default test user ID.

    Override this fixture in tests that need a different user:

        @pytest.fixture
        def mock_user_id():
            return "other-user-456"
    """
    return DEFAULT_TEST_USER_ID


@pytest.fixture
async def test_client(
    db_session: AsyncSession,
    mock_user_id: str,
) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database and auth overrides."""

    async def override_get_db():
        yield db_session

    async def override_get_user_id():
        return mock_user_id

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_user_id] = override_get_user_id

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
def create_test_topic(db_session: AsyncSession, mock_user_id: str):
    """Factory fixture to create topics in the test database.

    Usage:
        topic = await create_test_topic(name="My Topic")
        topic = await create_test_topic(user_id="other-user", srs_enabled=False)
    """

    async def _create_topic(
        user_id: str | None = None,
        name: str = "Test Topic",
        notes: str | None = None,
        parent_id: int | None = None,
        srs_enabled: bool = True,
        initial_stability: float | None = None,
        initial_difficulty: float | None = None,
        initial_state: str = "LEARNING",
        initial_step: int | None = 0,
    ) -> Topic:
        # Use mock_user_id as default if not specified
        actual_user_id = user_id if user_id is not None else mock_user_id

        fsrs_state = None
        if srs_enabled:
            fsrs_state = FsrsState(
                srs_enabled=True,
                stability=initial_stability,
                difficulty=initial_difficulty,
                state=initial_state,
                step=initial_step,
            )
            db_session.add(fsrs_state)
            await db_session.flush()

        topic = Topic(
            user_id=actual_user_id,
            name=name,
            notes=notes,
            parent_id=parent_id,
            fsrs_state_id=fsrs_state.id if fsrs_state else None,
        )
        db_session.add(topic)
        await db_session.flush()

        # Re-fetch to get trigger-computed fields (path) and load relationships
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        return result.scalar_one()

    return _create_topic


@pytest.fixture
def create_test_source(db_session: AsyncSession, mock_user_id: str):
    """Factory fixture to create sources in the test database.

    Usage:
        source = await create_test_source(title="My Source")
        source = await create_test_source(user_id="other-user", srs_enabled=False)
        source = await create_test_source(title="Child", parent_id=parent.id)
    """

    async def _create_source(
        user_id: str | None = None,
        title: str = "Test Source",
        notes: str | None = None,
        parent_id: int | None = None,
        srs_enabled: bool = True,
        initial_stability: float | None = None,
        initial_difficulty: float | None = None,
        initial_state: str = "LEARNING",
        initial_step: int | None = 0,
    ) -> Source:
        # Use mock_user_id as default if not specified
        actual_user_id = user_id if user_id is not None else mock_user_id

        fsrs_state = None
        if srs_enabled:
            fsrs_state = FsrsState(
                srs_enabled=True,
                stability=initial_stability,
                difficulty=initial_difficulty,
                state=initial_state,
                step=initial_step,
            )
            db_session.add(fsrs_state)
            await db_session.flush()

        source = Source(
            user_id=actual_user_id,
            title=title,
            notes=notes,
            parent_id=parent_id,
            fsrs_state_id=fsrs_state.id if fsrs_state else None,
        )
        db_session.add(source)
        await db_session.flush()

        # Re-fetch to get trigger-computed fields (path) and load relationships
        result = await db_session.execute(
            select(Source)
            .where(Source.id == source.id)
            .options(selectinload(Source.fsrs_state))
        )
        return result.scalar_one()

    return _create_source
```

**Rationale**: Centralizes all integration test fixtures. The `mock_user_id` fixture provides clean auth mocking as a simple fixture (not a context manager). Factory fixtures use `flush()` instead of `commit()` since the session is bound to a connection with an open transaction—changes are visible within the test but rolled back after. Factory fixtures default to `mock_user_id` for convenience.

#### 6. Create basic smoke test
**File**: `apps/api/tests/integration/test_health.py`

```python
"""Basic integration tests to verify test infrastructure."""
from httpx import AsyncClient


async def test_root_endpoint_returns_message(test_client: AsyncClient):
    """Verify the root endpoint works."""
    response = await test_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
```

**Rationale**: Simple smoke test to verify Testcontainers and the test client work correctly. No `@pytest.mark.asyncio` needed with `asyncio_mode = "auto"`.

### Success Criteria

#### Automated Verification:
- [x] Command: `cd apps/api && uv sync`
- [x] Command: `cd apps/api && uv run pytest tests/integration/test_health.py -v`
- [x] Command: `cd apps/api && uv run ruff check --fix`
- [x] Command: `cd apps/api && uv run ruff format`

#### Manual Verification:
- [ ] Docker container starts successfully
- [ ] Database tables are created
- [ ] Smoke test passes

**Implementation Note**: This phase requires Docker to be running. Pause after verification before proceeding to Phase 2.

---

## Phase 2: Topics Integration Tests

### Overview
Add integration tests for the topics endpoints, testing CRUD operations with real database.

### Changes Required

#### 1. Create topics integration tests
**File**: `apps/api/tests/integration/test_topics.py`

```python
"""Integration tests for topics endpoints."""
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Topic


class TestTopicsEndpoints:
    """Integration tests for /topics endpoints."""

    async def test_list_topics_returns_empty_for_new_user(
        self,
        test_client: AsyncClient,
    ):
        """New user should have no topics."""
        response = await test_client.get("/topics/")

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_topics_returns_user_topics(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should return topics for the authenticated user."""
        await create_test_topic(name="My Test Topic")
        await create_test_topic(user_id="other-user", name="Other User Topic")

        response = await test_client.get("/topics/")

        assert response.status_code == 200
        topics = response.json()
        assert len(topics) == 1
        assert topics[0]["name"] == "My Test Topic"

    async def test_create_topic_success(
        self,
        test_client: AsyncClient,
    ):
        """Should create a new topic."""
        response = await test_client.post(
            "/topics/",
            json={
                "name": "New Topic",
                "notes": "Some notes",
                "srs_enabled": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Topic"
        assert data["notes"] == "Some notes"
        assert data["id"] is not None

    async def test_get_topic_by_id(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should return a specific topic by ID."""
        topic = await create_test_topic(name="Specific Topic")

        response = await test_client.get(f"/topics/{topic.id}/")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == topic.id
        assert data["name"] == "Specific Topic"

    async def test_get_topic_not_found(
        self,
        test_client: AsyncClient,
    ):
        """Should return 404 for non-existent topic."""
        response = await test_client.get("/topics/99999/")

        assert response.status_code == 404

    async def test_delete_topic_success(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """Should delete a topic."""
        topic = await create_test_topic(name="Topic to Delete")

        response = await test_client.delete(f"/topics/{topic.id}/")

        assert response.status_code == 200

        result = await db_session.execute(select(Topic).where(Topic.id == topic.id))
        assert result.scalar_one_or_none() is None

    async def test_update_topic_success(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should update a topic."""
        topic = await create_test_topic(name="Original Name")

        response = await test_client.patch(
            f"/topics/{topic.id}/",
            json={"name": "Updated Name"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
```

**Rationale**: Full HTTP integration tests that verify the complete request/response cycle with a real database. Uses centralized `mock_user_id` and `create_test_topic` fixtures from conftest. No `@pytest.mark.asyncio` decorators needed.

### Success Criteria

#### Automated Verification:
- [x] Command: `cd apps/api && uv run pytest tests/integration/test_topics.py -v`
- [x] Command: `cd apps/api && uv run ruff check --fix`
- [x] Command: `cd apps/api && uv run ruff format`

#### Manual Verification:
- [ ] All topic CRUD tests pass
- [ ] Test isolation works (changes roll back between tests)

**Implementation Note**: Pause after verification before proceeding to Phase 3.

---

## Phase 3: Reviews Integration Tests

### Overview
Add integration tests for the reviews endpoints, testing the complete FSRS flow with real database. This phase includes comprehensive FSRS behavior verification to ensure the spaced repetition algorithm works correctly.

### Changes Required

#### 1. Create reviews integration tests
**File**: `apps/api/tests/integration/test_reviews.py`

```python
"""Integration tests for reviews endpoints."""
from datetime import date, timedelta

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Topic, Source


class TestReviewsEndpoints:
    """Integration tests for /reviews endpoints."""

    async def test_create_topic_review_uncompleted(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Create an uncompleted review (scheduled but not done).

        Uncompleted reviews should NOT trigger FSRS calculations.
        """
        topic = await create_test_topic()

        response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["topic_id"] == topic.id
        assert data["completed_at"] is None
        assert data["rating"] is None
        # FSRS state should NOT be set for uncompleted reviews
        assert data["stability_before"] is None
        assert data["stability_after"] is None
        assert data["state_before"] is None
        assert data["state_after"] is None

    async def test_create_topic_review_completed_updates_fsrs(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """Create a completed review - should update topic's FSRS state.

        Verifies that:
        1. Review captures before/after FSRS state
        2. Topic's FSRS state is updated after review
        3. FSRS algorithm produces valid stability/difficulty values
        """
        topic = await create_test_topic()
        original_stability = topic.fsrs_state.stability
        original_state = topic.fsrs_state.state

        response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Review should capture before state (initial None values)
        assert data["stability_before"] == original_stability
        assert data["state_before"] == original_state

        # Review should have computed after state
        assert data["stability_after"] is not None
        assert data["stability_after"] > 0  # FSRS always produces positive stability
        assert data["difficulty_after"] is not None
        assert data["state_after"] in ["LEARNING", "REVIEW", "RELEARNING"]
        assert data["rating"] == "good"

        # Topic's FSRS state should be updated to match review's after state
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        refreshed_topic = result.scalar_one()
        assert refreshed_topic.fsrs_state.stability == data["stability_after"]
        assert refreshed_topic.fsrs_state.difficulty == data["difficulty_after"]
        assert refreshed_topic.fsrs_state.state == data["state_after"]

    async def test_create_review_with_inline_topic(
        self,
        test_client: AsyncClient,
    ):
        """Create a review with inline topic creation."""
        response = await test_client.post(
            "/reviews/",
            json={
                "topic": {
                    "name": "Inline Created Topic",
                    "notes": "Created during review",
                },
                "scheduled_at": str(date.today()),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["topic"]["name"] == "Inline Created Topic"

    async def test_list_reviews_filters_by_topic(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """List reviews should filter by topic_id."""
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        # Create reviews for both topics
        await test_client.post(
            "/reviews/",
            json={"topic_id": topic1.id, "scheduled_at": str(date.today())},
        )
        await test_client.post(
            "/reviews/",
            json={"topic_id": topic2.id, "scheduled_at": str(date.today())},
        )

        # Filter by topic1
        response = await test_client.get(f"/reviews/?topic_id={topic1.id}")

        assert response.status_code == 200
        reviews = response.json()
        assert len(reviews) == 1
        assert reviews[0]["topic_id"] == topic1.id

    async def test_update_review_rating_recalculates_fsrs(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Updating a review's rating should recalculate FSRS state.

        Verifies that changing rating triggers FSRS recalculation with
        different stability output.
        """
        topic = await create_test_topic()

        # Create completed review with "good" rating
        create_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )
        review_id = create_response.json()["id"]
        original_stability_after = create_response.json()["stability_after"]

        # Update to "easy" rating
        update_response = await test_client.post(
            f"/reviews/{review_id}/",
            json={"rating": "easy"},
        )

        assert update_response.status_code == 200
        data = update_response.json()

        # "easy" should produce different stability than "good"
        # (typically higher stability for easier ratings)
        assert data["stability_after"] != original_stability_after
        assert data["rating"] == "easy"
        # Before state should remain unchanged
        assert data["stability_before"] == create_response.json()["stability_before"]

    async def test_delete_review_triggers_replay(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Deleting a review should replay subsequent reviews.

        When review1 is deleted, review2's before/after states should be
        recalculated starting from the initial topic state (not review1's after state).
        """
        topic = await create_test_topic()

        # Create two completed reviews
        response1 = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today() - timedelta(days=1)),
                "completed_at": str(date.today() - timedelta(days=1)),
                "rating": "good",
            },
        )
        review1_id = response1.json()["id"]
        review1_stability_after = response1.json()["stability_after"]

        response2 = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )
        review2_id = response2.json()["id"]
        # Review2's before state should be review1's after state
        review2_stability_before = response2.json()["stability_before"]
        assert review2_stability_before == review1_stability_after

        # Delete review 1 - should trigger replay of review 2
        delete_response = await test_client.delete(f"/reviews/{review1_id}/")
        assert delete_response.status_code == 200

        # Fetch review2 to verify it was replayed
        get_response = await test_client.get(f"/reviews/{review2_id}/")

        assert get_response.status_code == 200
        replayed_review2 = get_response.json()

        # After replay, review2's before state should be the initial topic state
        # (None, since there are no prior reviews now)
        assert replayed_review2["stability_before"] is None
        # The after state should be recalculated from initial state
        assert replayed_review2["stability_after"] is not None


class TestFsrsRatingBehavior:
    """Tests verifying FSRS algorithm produces correct outputs for different ratings."""

    async def test_different_ratings_produce_different_stability(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Different ratings should produce different stability values.

        FSRS rating impact on stability (from lowest to highest):
        miss < hard < good < easy
        """
        # Create 4 topics with identical initial state
        topics = {}
        ratings = ["miss", "hard", "good", "easy"]
        for rating in ratings:
            topics[rating] = await create_test_topic(name=f"Topic for {rating}")

        stability_results = {}

        for rating in ratings:
            response = await test_client.post(
                "/reviews/",
                json={
                    "topic_id": topics[rating].id,
                    "scheduled_at": str(date.today()),
                    "completed_at": str(date.today()),
                    "rating": rating,
                },
            )
            assert response.status_code == 200
            stability_results[rating] = response.json()["stability_after"]

        # Verify stability ordering: miss < hard < good < easy
        assert stability_results["miss"] < stability_results["hard"]
        assert stability_results["hard"] < stability_results["good"]
        assert stability_results["good"] < stability_results["easy"]

    async def test_fsrs_state_transitions_learning_to_review(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """FSRS should transition from LEARNING to REVIEW state after enough successful reviews.

        In LEARNING state, step increments until graduation threshold.
        After graduation, state becomes REVIEW and step becomes None.
        """
        topic = await create_test_topic(
            initial_state="LEARNING",
            initial_step=0,
        )

        # Do multiple "good" reviews to progress through learning
        for i in range(5):  # FSRS typically graduates after 2-4 reviews
            response = await test_client.post(
                "/reviews/",
                json={
                    "topic_id": topic.id,
                    "scheduled_at": str(date.today() + timedelta(days=i)),
                    "completed_at": str(date.today() + timedelta(days=i)),
                    "rating": "good",
                },
            )
            assert response.status_code == 200

            state_after = response.json()["state_after"]
            if state_after == "REVIEW":
                # Successfully graduated to review state
                assert response.json()["step_after"] is None
                break
        else:
            # If we didn't break, we should still be in a valid state
            assert response.json()["state_after"] in ["LEARNING", "REVIEW"]

    async def test_fsrs_relearning_on_miss(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """A 'miss' rating on a REVIEW state item should trigger RELEARNING.

        When a reviewed item is forgotten (miss), FSRS puts it back into
        relearning state to rebuild memory.
        """
        # Start with a topic already in REVIEW state (graduated)
        topic = await create_test_topic(
            initial_state="REVIEW",
            initial_stability=10.0,
            initial_difficulty=5.0,
            initial_step=None,  # No step in REVIEW state
        )

        response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "miss",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # After a miss, item should enter RELEARNING state
        assert data["state_before"] == "REVIEW"
        assert data["state_after"] == "RELEARNING"
        # Stability should decrease significantly after a miss
        assert data["stability_after"] < data["stability_before"]


class TestFsrsReplayEdgeCases:
    """Tests for edge cases in FSRS replay logic."""

    async def test_insert_review_in_middle_triggers_replay(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Inserting a review with an earlier date should replay subsequent reviews.

        If review2 exists, then review1 is created with an earlier date,
        review2 should be replayed with review1's after state as its before state.
        """
        topic = await create_test_topic()

        # Create review2 first (dated today)
        response2 = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )
        review2_id = response2.json()["id"]
        original_review2_stability_before = response2.json()["stability_before"]

        # Now create review1 with an earlier date (yesterday)
        response1 = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today() - timedelta(days=1)),
                "completed_at": str(date.today() - timedelta(days=1)),
                "rating": "hard",
            },
        )
        review1_stability_after = response1.json()["stability_after"]

        # Fetch review2 to verify it was replayed
        get_response = await test_client.get(f"/reviews/{review2_id}/")

        assert get_response.status_code == 200
        replayed_review2 = get_response.json()

        # Review2's before state should now be review1's after state
        assert replayed_review2["stability_before"] == review1_stability_after
        # Before state should have changed from original
        assert replayed_review2["stability_before"] != original_review2_stability_before

    async def test_complete_uncompleted_review_triggers_fsrs(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Completing a previously uncompleted review should trigger FSRS calculation.

        When an uncompleted review gets a completed_at date, FSRS should run.
        """
        topic = await create_test_topic()

        # Create uncompleted review
        create_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
            },
        )
        review_id = create_response.json()["id"]
        assert create_response.json()["completed_at"] is None
        assert create_response.json()["stability_after"] is None

        # Complete the review
        update_response = await test_client.post(
            f"/reviews/{review_id}/",
            json={
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert update_response.status_code == 200
        data = update_response.json()

        # Now FSRS should have run
        assert data["completed_at"] is not None
        assert data["stability_after"] is not None
        assert data["state_after"] is not None

    async def test_delete_only_review_resets_topic_state(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """Deleting the only review should reset topic to initial FSRS state."""
        topic = await create_test_topic()
        original_stability = topic.fsrs_state.stability
        original_state = topic.fsrs_state.state

        # Create and then delete a review
        create_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )
        review_id = create_response.json()["id"]

        # Verify topic state changed
        assert create_response.json()["stability_after"] != original_stability

        # Delete the review
        await test_client.delete(f"/reviews/{review_id}/")

        # Fetch topic and verify state is reset
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        refreshed_topic = result.scalar_one()

        # Topic should be back to initial state
        assert refreshed_topic.fsrs_state.stability == original_stability
        assert refreshed_topic.fsrs_state.state == original_state


class TestSourceReviews:
    """Integration tests for source reviews (polymorphic)."""

    async def test_create_source_review(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Create a review for a source."""
        source = await create_test_source()

        response = await test_client.post(
            "/reviews/",
            json={
                "source_id": source.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["source_id"] == source.id
        assert data["topic_id"] is None
        # FSRS should have run for completed source review
        assert data["stability_after"] is not None

    async def test_source_review_fsrs_independent_of_topics(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
        create_test_source,
    ):
        """Source reviews should update source FSRS state, not topic state.

        Verifies that the polymorphic review system correctly routes FSRS
        calculations to the right entity.
        """
        topic = await create_test_topic()
        source = await create_test_source()

        # Create a source review
        response = await test_client.post(
            "/reviews/",
            json={
                "source_id": source.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "easy",
            },
        )
        source_stability = response.json()["stability_after"]

        # Verify source was updated
        result = await db_session.execute(
            select(Source)
            .where(Source.id == source.id)
            .options(selectinload(Source.fsrs_state))
        )
        refreshed_source = result.scalar_one()
        assert refreshed_source.fsrs_state.stability == source_stability

        # Verify topic was NOT updated (still initial state)
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        refreshed_topic = result.scalar_one()
        assert refreshed_topic.fsrs_state.stability is None  # Still initial
```

**Rationale**: Tests the most complex API endpoints (reviews) with real database interactions and FSRS calculations. Uses centralized fixtures from conftest. Comprehensive FSRS testing ensures the spaced repetition algorithm works correctly across all scenarios. No `@pytest.mark.asyncio` decorators needed.

### Success Criteria

#### Automated Verification:
- [ ] Command: `cd apps/api && uv run pytest tests/integration/test_reviews.py -v`
- [ ] Command: `cd apps/api && uv run ruff check --fix`
- [ ] Command: `cd apps/api && uv run ruff format`

#### Manual Verification:
- [ ] Review creation updates FSRS state correctly
- [ ] Review deletion triggers replay and correctly recalculates subsequent reviews
- [ ] Polymorphic reviews (topic vs source) work correctly
- [ ] Different ratings produce different stability values (miss < hard < good < easy)
- [ ] FSRS state transitions work (LEARNING -> REVIEW, REVIEW -> RELEARNING on miss)
- [ ] Inserting a review in the middle triggers replay of subsequent reviews
- [ ] Completing an uncompleted review triggers FSRS calculation
- [ ] Deleting the only review resets topic to initial state

**Implementation Note**: Pause after verification before proceeding to Phase 4.

---

## Phase 4: Sources Integration Tests & CI Setup

### Overview
Add integration tests for sources endpoints and set up GitHub Actions for CI.

### Changes Required

#### 1. Create sources integration tests
**File**: `apps/api/tests/integration/test_sources.py`

```python
"""Integration tests for sources endpoints."""
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Source


class TestSourcesEndpoints:
    """Integration tests for /sources endpoints."""

    async def test_list_sources_returns_empty_for_new_user(
        self,
        test_client: AsyncClient,
    ):
        """New user should have no sources."""
        response = await test_client.get("/sources/")

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_sources_returns_user_sources(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should return sources for the authenticated user."""
        await create_test_source(title="My Test Source")
        await create_test_source(user_id="other-user", title="Other User Source")

        response = await test_client.get("/sources/")

        assert response.status_code == 200
        sources = response.json()
        assert len(sources) == 1
        assert sources[0]["title"] == "My Test Source"

    async def test_create_source_success(
        self,
        test_client: AsyncClient,
    ):
        """Should create a new source."""
        response = await test_client.post(
            "/sources/",
            json={
                "title": "New Source",
                "notes": "Some notes",
                "srs_enabled": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New Source"
        assert data["notes"] == "Some notes"
        assert data["id"] is not None

    async def test_get_source_by_id(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should return a specific source by ID."""
        source = await create_test_source(title="Specific Source")

        response = await test_client.get(f"/sources/{source.id}/")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == source.id
        assert data["title"] == "Specific Source"

    async def test_get_source_not_found(
        self,
        test_client: AsyncClient,
    ):
        """Should return 404 for non-existent source."""
        response = await test_client.get("/sources/99999/")

        assert response.status_code == 404

    async def test_delete_source_success(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """Should delete a source."""
        source = await create_test_source(title="Source to Delete")

        response = await test_client.delete(f"/sources/{source.id}/")

        assert response.status_code == 200

        result = await db_session.execute(select(Source).where(Source.id == source.id))
        assert result.scalar_one_or_none() is None

    async def test_update_source_success(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should update a source."""
        source = await create_test_source(title="Original Title")

        response = await test_client.patch(
            f"/sources/{source.id}/",
            json={"title": "Updated Title"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
```

**Rationale**: Completes the CRUD integration test coverage for all main entity types. Uses centralized fixtures from conftest. No `@pytest.mark.asyncio` decorators needed.

#### 2. Add GitHub Actions workflow for tests
**File**: `.github/workflows/api-tests.yml`

```yaml
name: API Tests

on:
  push:
    paths:
      - 'apps/api/**'
      - 'supabase/migrations/**'
      - '.github/workflows/api-tests.yml'
  pull_request:
    paths:
      - 'apps/api/**'
      - 'supabase/migrations/**'
      - '.github/workflows/api-tests.yml'

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v5
        with:
          version: "latest"

      - name: Set up Python
        run: uv python install 3.12

      - name: Cache uv dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/uv
          key: ${{ runner.os }}-uv-${{ hashFiles('apps/api/pyproject.toml') }}
          restore-keys: |
            ${{ runner.os }}-uv-

      - name: Install dependencies
        working-directory: apps/api
        run: uv sync --all-groups

      - name: Run linting
        working-directory: apps/api
        run: |
          uv run ruff check
          uv run ruff format --check

      - name: Run integration tests with coverage
        working-directory: apps/api
        run: |
          uv run pytest tests/integration \
            -v \
            --tb=short \
            --cov=app \
            --cov-report=term-missing \
            --cov-report=xml

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: apps/api/coverage.xml
          flags: api
          fail_ci_if_error: false
```

**Rationale**: CI workflow ensures integration tests run on every push/PR affecting the API or migrations. Dependency caching speeds up subsequent runs. Coverage reporting via pytest-cov and Codecov integration provides visibility into test coverage. The workflow also triggers on migration changes since those affect the test database schema.

### Success Criteria

#### Automated Verification:
- [ ] Command: `cd apps/api && uv run pytest tests/integration/ -v --cov=app`
- [ ] Command: `cd apps/api && uv run ruff check --fix`
- [ ] Command: `cd apps/api && uv run ruff format`

#### Manual Verification:
- [ ] All integration tests pass
- [ ] CI workflow runs successfully (if pushed)
- [ ] Coverage report is generated

**Implementation Note**: Pause after verification before proceeding to Phase 5.

---

## Phase 5: Ltree/Tree Integration Tests (Topics & Sources)

### Overview
Add integration tests for tree hierarchy operations using ltree for both Topics and Sources. Tests verify parent/child relationships, cycle detection, path computation by database triggers, and child handling strategies on delete.

### Changes Required

#### 1. Create topics tree integration tests
**File**: `apps/api/tests/integration/test_topics_tree.py`

```python
"""Integration tests for topics tree/hierarchy endpoints."""
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
        result = await db_session.execute(
            select(Topic).where(Topic.id == child_id)
        )
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
        child1 = await create_test_topic(name="Child 1", parent_id=parent.id)
        child2 = await create_test_topic(name="Child 2", parent_id=parent.id)
        # Grandchild should NOT be returned (not direct child)
        await create_test_topic(name="Grandchild", parent_id=child1.id)

        response = await test_client.get(f"/topics/{parent.id}/children/")

        assert response.status_code == 200
        children = response.json()
        assert len(children) == 2
        child_names = {c["name"] for c in children}
        assert child_names == {"Child 1", "Child 2"}

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

    async def test_remove_child_from_parent(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """DELETE /topics/{parent_id}/children/{child_id}/ orphans the child."""
        parent = await create_test_topic(name="Parent")
        child = await create_test_topic(name="Child", parent_id=parent.id)

        response = await test_client.delete(
            f"/topics/{parent.id}/children/{child.id}/"
        )

        assert response.status_code == 200

        # Verify child is orphaned (parent_id = null)
        result = await db_session.execute(
            select(Topic).where(Topic.id == child.id)
        )
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
            result = await db_session.execute(
                select(Topic).where(Topic.id == topic_id)
            )
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
            result = await db_session.execute(
                select(Topic).where(Topic.id == child_id)
            )
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
        result = await db_session.execute(
            select(Topic).where(Topic.id == child.id)
        )
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

        assert response.status_code == 409
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
        root2 = await create_test_topic(name="Root 2")
        await create_test_topic(name="Child", parent_id=root1.id)

        response = await test_client.get("/topics/?root=true")

        assert response.status_code == 200
        topics = response.json()
        assert len(topics) == 2
        topic_names = {t["name"] for t in topics}
        assert topic_names == {"Root 1", "Root 2"}

    async def test_addable_as_parent_excludes_descendants(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """addable_as_parent_to filter excludes self and descendants."""
        grandparent = await create_test_topic(name="Grandparent")
        parent = await create_test_topic(name="Parent", parent_id=grandparent.id)
        child = await create_test_topic(name="Child", parent_id=parent.id)
        unrelated = await create_test_topic(name="Unrelated")

        # When picking a new parent for 'parent', should exclude:
        # - parent itself
        # - child (descendant)
        # - grandparent (current parent)
        response = await test_client.get(
            f"/topics/?addable_as_parent_to={parent.id}"
        )

        assert response.status_code == 200
        topics = response.json()
        topic_ids = {t["id"] for t in topics}

        # Should only include unrelated topic
        assert unrelated.id in topic_ids
        assert parent.id not in topic_ids
        assert child.id not in topic_ids
        assert grandparent.id not in topic_ids

    async def test_addable_as_child_excludes_ancestors(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """addable_as_child_to filter excludes self and ancestors."""
        grandparent = await create_test_topic(name="Grandparent")
        parent = await create_test_topic(name="Parent", parent_id=grandparent.id)
        child = await create_test_topic(name="Child", parent_id=parent.id)
        unrelated = await create_test_topic(name="Unrelated")

        # When picking a new child for 'parent', should exclude:
        # - parent itself
        # - grandparent (ancestor)
        # - child (already a child)
        response = await test_client.get(
            f"/topics/?addable_as_child_to={parent.id}"
        )

        assert response.status_code == 200
        topics = response.json()
        topic_ids = {t["id"] for t in topics}

        # Should only include unrelated topic
        assert unrelated.id in topic_ids
        assert parent.id not in topic_ids
        assert grandparent.id not in topic_ids
        assert child.id not in topic_ids


class TestTopicFsrsInheritance:
    """Tests for FSRS state inheritance from parent."""

    async def test_child_inherits_fsrs_from_parent(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """Child with inherit_fsrs=true gets parent's FSRS values."""
        # Create parent with established FSRS state
        parent = await create_test_topic(
            name="Parent",
            initial_stability=10.0,
            initial_difficulty=5.0,
            initial_state="REVIEW",
        )

        response = await test_client.post(
            "/topics/",
            json={
                "name": "Child",
                "parent_id": parent.id,
                "srs_enabled": True,
                "inherit_fsrs": True,
            },
        )

        assert response.status_code == 200
        child_id = response.json()["id"]

        # Fetch child's FSRS state
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == child_id)
            .options(selectinload(Topic.fsrs_state))
        )
        child = result.scalar_one()

        # Verify inherited values
        assert child.fsrs_state.inherited_stability == 10.0
        assert child.fsrs_state.inherited_difficulty == 5.0
        assert child.fsrs_state.inherited_state == "REVIEW"
```

**Rationale**: Comprehensive tests for all ltree/tree operations on Topics. Tests are organized into logical groups: basic operations, cycle detection, delete strategies, filtering, and FSRS inheritance. Uses the existing `create_test_topic` factory fixture which already supports `parent_id`. No `@pytest.mark.asyncio` decorators needed.

#### 2. Create sources tree integration tests
**File**: `apps/api/tests/integration/test_sources_tree.py`

```python
"""Integration tests for sources tree/hierarchy endpoints."""
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
        result = await db_session.execute(
            select(Source).where(Source.id == child_id)
        )
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
        child1 = await create_test_source(title="Child 1", parent_id=parent.id)
        child2 = await create_test_source(title="Child 2", parent_id=parent.id)
        # Grandchild should NOT be returned (not direct child)
        await create_test_source(title="Grandchild", parent_id=child1.id)

        response = await test_client.get(f"/sources/{parent.id}/children/")

        assert response.status_code == 200
        children = response.json()
        assert len(children) == 2
        child_titles = {c["title"] for c in children}
        assert child_titles == {"Child 1", "Child 2"}

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
        result = await db_session.execute(
            select(Source).where(Source.id == child.id)
        )
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
        result = await db_session.execute(
            select(Source).where(Source.id == child.id)
        )
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

        assert response.status_code == 409
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
        root2 = await create_test_source(title="Root 2")
        await create_test_source(title="Child", parent_id=root1.id)

        response = await test_client.get("/sources/?root=true")

        assert response.status_code == 200
        sources = response.json()
        assert len(sources) == 2
        source_titles = {s["title"] for s in sources}
        assert source_titles == {"Root 1", "Root 2"}

    async def test_addable_as_parent_excludes_descendants(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """addable_as_parent_to filter excludes self and descendants."""
        grandparent = await create_test_source(title="Grandparent")
        parent = await create_test_source(title="Parent", parent_id=grandparent.id)
        child = await create_test_source(title="Child", parent_id=parent.id)
        unrelated = await create_test_source(title="Unrelated")

        # When picking a new parent for 'parent', should exclude:
        # - parent itself
        # - child (descendant)
        # - grandparent (current parent)
        response = await test_client.get(
            f"/sources/?addable_as_parent_to={parent.id}"
        )

        assert response.status_code == 200
        sources = response.json()
        source_ids = {s["id"] for s in sources}

        # Should only include unrelated source
        assert unrelated.id in source_ids
        assert parent.id not in source_ids
        assert child.id not in source_ids
        assert grandparent.id not in source_ids

    async def test_addable_as_child_excludes_ancestors(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """addable_as_child_to filter excludes self and ancestors."""
        grandparent = await create_test_source(title="Grandparent")
        parent = await create_test_source(title="Parent", parent_id=grandparent.id)
        child = await create_test_source(title="Child", parent_id=parent.id)
        unrelated = await create_test_source(title="Unrelated")

        # When picking a new child for 'parent', should exclude:
        # - parent itself
        # - grandparent (ancestor)
        # - child (already a child)
        response = await test_client.get(
            f"/sources/?addable_as_child_to={parent.id}"
        )

        assert response.status_code == 200
        sources = response.json()
        source_ids = {s["id"] for s in sources}

        # Should only include unrelated source
        assert unrelated.id in source_ids
        assert parent.id not in source_ids
        assert grandparent.id not in source_ids
        assert child.id not in source_ids


class TestSourceFsrsInheritance:
    """Tests for FSRS state inheritance from parent."""

    async def test_child_inherits_fsrs_from_parent(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_source,
    ):
        """Child with inherit_fsrs=true gets parent's FSRS values."""
        # Create parent with established FSRS state
        parent = await create_test_source(
            title="Parent",
            initial_stability=10.0,
            initial_difficulty=5.0,
            initial_state="REVIEW",
        )

        response = await test_client.post(
            "/sources/",
            json={
                "title": "Child",
                "parent_id": parent.id,
                "srs_enabled": True,
                "inherit_fsrs": True,
            },
        )

        assert response.status_code == 200
        child_id = response.json()["id"]

        # Fetch child's FSRS state
        result = await db_session.execute(
            select(Source)
            .where(Source.id == child_id)
            .options(selectinload(Source.fsrs_state))
        )
        child = result.scalar_one()

        # Verify inherited values
        assert child.fsrs_state.inherited_stability == 10.0
        assert child.fsrs_state.inherited_difficulty == 5.0
        assert child.fsrs_state.inherited_state == "REVIEW"
```

**Rationale**: Comprehensive tests for all ltree/tree operations on Sources. Mirrors the Topics tree tests structure for consistency. Uses the existing `create_test_source` factory fixture which already supports `parent_id`. No `@pytest.mark.asyncio` decorators needed.

### Success Criteria

#### Automated Verification:
- [ ] Command: `cd apps/api && uv run pytest tests/integration/test_topics_tree.py tests/integration/test_sources_tree.py -v`
- [ ] Command: `cd apps/api && uv run ruff check --fix`
- [ ] Command: `cd apps/api && uv run ruff format`

#### Manual Verification:
- [ ] Topics: Path computation by database trigger works
- [ ] Topics: Cycle detection prevents circular relationships
- [ ] Topics: All delete strategies (delete/orphan/reparent) work correctly
- [ ] Topics: Tree filtering (root, addable_as_parent_to, addable_as_child_to) works
- [ ] Topics: FSRS inheritance from parent works
- [ ] Sources: Path computation by database trigger works
- [ ] Sources: Cycle detection prevents circular relationships
- [ ] Sources: All delete strategies (delete/orphan/reparent) work correctly
- [ ] Sources: Tree filtering (root, addable_as_parent_to, addable_as_child_to) works
- [ ] Sources: FSRS inheritance from parent works

---

## Testing Strategy

### Integration Tests
- Test full HTTP request/response cycle
- Use Testcontainers for real PostgreSQL
- Verify actual database interactions
- Mock authentication via `mock_user_id` fixture
- Test isolation via nested transactions (savepoints)
- All shared fixtures (`create_test_topic`, `create_test_source`, `mock_user_id`) centralized in `tests/integration/conftest.py`

### Database Setup (Migration-Based)
- **Uses actual migration files** from `supabase/migrations/` instead of SQLAlchemy's `create_all()`
- **Benefits**:
  - Tests run against identical schema as production
  - All triggers (ltree path computation, updated_at) work automatically
  - All functions and stored procedures are available
  - No need to manually replicate database logic in test fixtures
- **Supabase-specific filtering**: Migration SQL wrapped in `-- @supabase-only-start` / `-- @supabase-only-end` flags is skipped for test database setup
- **Adding new Supabase-specific SQL**: When adding Supabase-specific SQL to migrations (grants, extensions, etc.), wrap it in the flags

### Test Isolation
- **Nested transactions (savepoints)**: Each test runs within a savepoint that is rolled back after the test completes
- **No cleanup needed**: The outer transaction is never committed, so all test changes are automatically discarded
- **Works with endpoint commits**: Even if the endpoint commits, it only commits to the savepoint, not the outer transaction

### Test File Structure
```
tests/
├── conftest.py                    # Database/container fixtures
└── integration/
    ├── __init__.py
    ├── conftest.py                # HTTP client, mock_user_id, factory fixtures
    ├── test_health.py             # Smoke test
    ├── test_topics.py             # Topics CRUD
    ├── test_topics_tree.py        # Topics tree/hierarchy (Phase 5)
    ├── test_reviews.py            # Reviews + FSRS behavior
    ├── test_sources.py            # Sources CRUD
    └── test_sources_tree.py       # Sources tree/hierarchy (Phase 5)
```

### Test Coverage
- Topics CRUD: List, Create, Read, Update, Delete
- Topics Tree: Parent/child, path computation, cycle detection, delete strategies, tree filtering, FSRS inheritance
- Sources CRUD: List, Create, Read, Update, Delete
- Sources Tree: Parent/child, path computation, cycle detection, delete strategies, tree filtering, FSRS inheritance
- Reviews: Create (completed/uncompleted), Update rating, Delete with replay, Filter by topic/source
- Polymorphic behavior: Reviews for topics vs sources

### FSRS Algorithm Coverage (Phase 3)
The reviews integration tests comprehensively verify FSRS behavior:

1. **Rating Impact**: Different ratings (`miss`, `hard`, `good`, `easy`) produce correctly ordered stability values
2. **State Transitions**:
   - LEARNING -> REVIEW (graduation after successful reviews)
   - REVIEW -> RELEARNING (triggered by `miss` rating)
3. **Replay Logic**:
   - Delete review triggers replay of subsequent reviews
   - Insert review with earlier date triggers replay
   - Delete only review resets topic to initial state
4. **Completion Flow**: Uncompleted -> completed review triggers FSRS calculation
5. **Polymorphic FSRS**: Source reviews update source FSRS state independently of topics

### Ltree/Tree Hierarchy Coverage (Phase 5)
The tree integration tests verify hierarchy operations for both Topics and Sources:

1. **Basic Operations**: Create with parent, get children, add/remove child relationships
2. **Path Computation**: Database trigger computes ltree path correctly
3. **Cycle Detection**: Prevents setting descendant as parent, ancestor as child, self as parent
4. **Delete Strategies**:
   - `delete`: Recursively removes all descendants
   - `orphan`: Makes children root items (parent_id = null)
   - `reparent`: Moves children to grandparent
5. **Tree Filtering**: `root=true`, `addable_as_parent_to`, `addable_as_child_to` query params
6. **FSRS Inheritance**: Child items inherit FSRS state from parent when `inherit_fsrs=true`

Both Topics and Sources have identical tree functionality, so both are tested with parallel test structures.

## Performance Considerations

- Session-scoped Testcontainer: One container per test run (fast startup)
- Test isolation via savepoint rollback: Efficient cleanup without truncation
- No `@pytest.mark.asyncio` overhead: Using `asyncio_mode = "auto"`

## References
- pytest-asyncio docs: https://pytest-asyncio.readthedocs.io/
- Testcontainers Python: https://testcontainers-python.readthedocs.io/
- FastAPI testing: https://fastapi.tiangolo.com/tutorial/testing/
- SQLAlchemy nested transactions: https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#using-savepoint
