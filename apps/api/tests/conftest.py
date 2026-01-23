"""Shared test fixtures for integration tests."""

from __future__ import annotations

import re
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


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
