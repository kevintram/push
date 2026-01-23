"""Integration test fixtures specific to HTTP testing."""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.main import app
from app.core.db import get_db
from app.dependencies import get_user_id
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
