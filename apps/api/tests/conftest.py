"""Shared test fixtures for integration tests."""

from __future__ import annotations

import os

# Set test environment variables before any app imports
# These provide defaults so Settings() can be instantiated in CI
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("WORKOS_API_KEY", "test")
os.environ.setdefault("WORKOS_CLIENT_ID", "test")
os.environ.setdefault("WORKOS_COOKIE_PASSWORD", "test-cookie-password-32chars!!")
os.environ.setdefault("WORKOS_COOKIE_NAME", "test_session")
os.environ.setdefault("APP_URL", "http://localhost:3000")
os.environ.setdefault("API_URL", "http://localhost:8000")
os.environ.setdefault("DOMAIN", "localhost")
os.environ.setdefault("ENV", "test")

import re
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload

from app.main import app
from app.database import get_db
from app.auth.dependencies import get_user_id
from app.models import Topic, Source, Practice, FsrsState, Review


def filter_migration_sql(sql: str) -> str:
    """Filter out Supabase-specific SQL wrapped in @supabase-only flags.

    Migrations should wrap Supabase-specific SQL like this:
        -- @supabase-only-start
        GRANT SELECT ON table_name TO anon;
        -- @supabase-only-end
    """
    pattern = r"--\s*@supabase-only-start.*?--\s*@supabase-only-end"
    return re.sub(pattern, "", sql, flags=re.DOTALL | re.IGNORECASE)


@pytest.fixture(scope="session")
def postgres_container():
    """Start a PostgreSQL container for integration tests."""
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("postgres:16-alpine") as postgres:
        yield postgres


@pytest.fixture(scope="session")
def database_url(postgres_container) -> str:
    """Get the async database URL for the test container."""
    import urllib.parse

    raw_url = postgres_container.get_connection_url()
    # Parse the URL and construct asyncpg URL manually
    # (Using make_url + update_query_dict can corrupt the password)
    parsed = urllib.parse.urlparse(
        raw_url.replace("postgresql+psycopg2://", "postgresql://")
    )
    return (
        f"postgresql+asyncpg://{parsed.username}:{parsed.password}"
        f"@{parsed.hostname}:{parsed.port}{parsed.path}"
    )


@pytest.fixture(scope="session")
def sync_database_url(postgres_container) -> str:
    """Get the sync database URL for running migrations."""
    # testcontainers returns postgresql+psycopg2://, but psycopg2 expects postgresql://
    url = postgres_container.get_connection_url()
    return url.replace("postgresql+psycopg2://", "postgresql://")


@pytest.fixture(scope="session")
async def async_engine(database_url):
    """Create an async engine for the test database."""
    engine = create_async_engine(
        database_url,
        echo=False,
        poolclass=NullPool,
        connect_args={
            "ssl": False,
            "server_settings": {"client_encoding": "utf8"},
        },
    )
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session")
def setup_database(sync_database_url):
    """Run migrations to set up database schema.

    Uses actual migration files to ensure tests run against the same
    schema as production, including triggers and functions.

    Supabase-specific SQL (GRANT, extensions, etc.) should be wrapped with
    @supabase-only flags in the migration files to be filtered out.
    """
    import psycopg2

    # Find migrations directory (relative to this file)
    # Path: tests/conftest.py -> tests -> api -> apps -> repo_root
    migrations_dir = (
        Path(__file__).parent.parent.parent.parent / "supabase" / "migrations"
    )

    if not migrations_dir.exists():
        raise RuntimeError(f"Migrations directory not found: {migrations_dir}")

    migration_files = sorted(migrations_dir.glob("*.sql"))

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
                cursor.execute(filtered_sql)
    finally:
        cursor.close()
        conn.close()

    yield


@pytest.fixture
async def db_session(
    async_engine, setup_database
) -> AsyncGenerator[AsyncSession, None]:
    """Create a database session for each test with proper isolation.

    Uses nested transactions (savepoints) to ensure each test starts with
    a clean database state. The outer transaction is never committed, so
    all changes are rolled back after each test.
    """
    async with async_engine.connect() as conn:
        await conn.begin()
        await conn.begin_nested()

        async_session = async_sessionmaker(
            bind=conn,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        async with async_session() as session:
            yield session

        await conn.rollback()


# --- HTTP Test Fixtures ---

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
            notes=notes or "",
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
            notes=notes or "",
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


@pytest.fixture
def create_test_review(db_session: AsyncSession, mock_user_id: str, create_test_topic):
    """Factory fixture to create reviews in the test database.

    Usage:
        review = await create_test_review()
        review = await create_test_review(topic_id=topic.id, rating="good")
        review = await create_test_review(source_id=source.id)
    """
    from datetime import date

    async def _create_review(
        topic_id: int | None = None,
        source_id: int | None = None,
        scheduled_at: date | None = None,
        completed_at: date | None = None,
        rating: str | None = None,
        user_id: str | None = None,
    ) -> Review:
        # Use mock_user_id as default if not specified
        actual_user_id = user_id if user_id is not None else mock_user_id

        # Create topic if neither topic_id nor source_id provided
        if topic_id is None and source_id is None:
            topic = await create_test_topic()
            topic_id = topic.id

        review = Review(
            user_id=actual_user_id,
            topic_id=topic_id,
            source_id=source_id,
            scheduled_at=scheduled_at or date.today(),
            completed_at=completed_at,
            rating=rating,
        )
        db_session.add(review)
        await db_session.flush()
        return review

    return _create_review


@pytest.fixture
def create_test_practice(db_session: AsyncSession, mock_user_id: str):
    """Factory fixture to create practices in the test database.

    Usage:
        practice = await create_test_practice(prompt="What is X?")
        practice = await create_test_practice(user_id="other-user", srs_enabled=False)
    """

    async def _create_practice(
        user_id: str | None = None,
        prompt: str = "Test Prompt",
        answer: str = "Test Answer",
        srs_enabled: bool = True,
        inboxed: bool = False,
        archived: bool = False,
        initial_stability: float | None = None,
        initial_difficulty: float | None = None,
        initial_state: str = "LEARNING",
        initial_step: int | None = 0,
    ) -> Practice:
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

        practice = Practice(
            user_id=actual_user_id,
            prompt=prompt,
            answer=answer,
            inboxed=inboxed,
            archived=archived,
            fsrs_state_id=fsrs_state.id if fsrs_state else None,
        )
        db_session.add(practice)
        await db_session.flush()

        # Re-fetch to load relationships
        result = await db_session.execute(
            select(Practice)
            .where(Practice.id == practice.id)
            .options(selectinload(Practice.fsrs_state))
        )
        return result.scalar_one()

    return _create_practice
