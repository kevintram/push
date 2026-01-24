# API Architecture Refactor Implementation Plan

## Overview

Refactor the FastAPI API from a file-type based organization (`app/models/`, `app/schemas/`, `app/routers/`) to a domain-based organization following [FastAPI best practices](https://github.com/zhanymkanov/fastapi-best-practices). This includes:

1. Introducing service layers to extract business logic from routers
2. Organizing code by domain (`topics/`, `sources/`, `reviews/`, `auth/`)
3. Keeping shared `models/` and `schemas/` directories (to be migrated later)
4. Reorganizing tests to mirror the new domain structure

**Note:** We're keeping `app/` as the root directory (FastAPI's convention). No rename to `src/`.

## Current State Analysis

**Current Structure:**
```
apps/api/app/
├── main.py
├── dependencies.py              # SessionDep, UserIdDep, get_token_header
├── core/
│   ├── config.py               # Settings with Pydantic BaseSettings
│   ├── db.py                   # get_db() async session generator
│   └── auth.py                 # WorkOS client initialization
├── models/                     # All SQLAlchemy models
│   ├── base.py
│   ├── topics.py               # Topic + junction tables
│   ├── sources.py              # Source + junction tables
│   ├── reviews.py
│   ├── review_sessions.py
│   └── fsrs_state.py
├── schemas/                    # All Pydantic schemas
│   ├── topics.py
│   ├── sources.py
│   ├── reviews.py
│   ├── review_sessions.py
│   └── review_entries.py
├── routers/                    # All route handlers (with embedded business logic)
│   ├── topics.py               # 688 lines - CRUD, hierarchy, relationships
│   ├── sources.py              # 582 lines - CRUD, hierarchy, topic associations
│   ├── reviews.py              # 953 lines - CRUD + complex FSRS logic
│   ├── review_sessions.py      # 281 lines - CRUD + FSRS replay
│   ├── review_entries.py       # Entry operations
│   └── login.py                # 71 lines - WorkOS OAuth flow
├── types/
│   └── ltree.py                # Custom PostgreSQL ltree type
├── utils/
│   └── retrievability.py       # FSRS retrievability calculations
└── internal/
    └── admin.py                # Admin-only endpoints
```

**Current Test Structure:**
```
apps/api/tests/
├── conftest.py                 # Database fixtures (postgres container, migrations)
└── integration/
    ├── conftest.py             # HTTP client fixtures
    ├── test_health.py
    ├── test_topics.py
    ├── test_sources.py
    ├── test_reviews.py
    ├── test_topics_tree.py
    └── test_sources_tree.py
```

**Key Patterns in Current Code:**
- Helper functions in routers: `get_topic()`, `is_descendant_of()`, `load_topic_with_relationships()`
- FSRS logic spread across reviews.py: `map_rating_to_fsrs()`, `replay_subsequent_reviews()`, `replay_topic_reviews_from_date()`
- Duplicate patterns between topics/sources routers (cycle detection, child handling strategies)
- `ChildHandlingStrategy` enum defined in both topics.py and sources.py → will be consolidated to shared `app/constants.py`

## Desired End State

**Target Structure:**
```
apps/api/app/
├── main.py                     # App initialization, router includes, exception handlers
├── database.py                 # Database connection (renamed from core/db.py)
├── config.py                   # Global settings
├── exceptions.py               # Domain exception base classes (NOT HTTPException)
├── exception_handlers.py       # FastAPI exception handlers (domain → HTTP translation)
├── dependencies.py             # Shared dependencies (SessionDep only)
├── constants.py                # Shared constants (ChildHandlingStrategy)
├── models/                     # Shared models (keeping flat for now)
│   ├── __init__.py             # Re-exports all models
│   ├── base.py
│   ├── topics.py
│   ├── sources.py
│   ├── reviews.py
│   ├── review_sessions.py
│   └── fsrs_state.py
├── schemas/                    # Shared schemas (keeping flat for now)
│   ├── __init__.py             # Re-exports all schemas
│   ├── topics.py
│   ├── sources.py
│   ├── reviews.py
│   ├── review_sessions.py
│   └── review_entries.py
├── topics/
│   ├── __init__.py
│   ├── router.py               # Thin route handlers
│   └── service.py              # Business logic + data access
├── sources/
│   ├── __init__.py
│   ├── router.py
│   └── service.py
├── reviews/
│   ├── __init__.py
│   ├── router.py
│   ├── service.py              # Review CRUD + FSRS logic (kept together)
│   ├── entries/                # Review entries as sub-module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   └── service.py
│   └── sessions/               # Review sessions as sub-module
│       ├── __init__.py
│       ├── router.py
│       └── service.py
├── auth/
│   ├── __init__.py
│   ├── router.py               # login, callback, logout
│   ├── dependencies.py         # get_user_id, UserIdDep
│   └── workos.py               # WorkOS client initialization
├── admin/
│   ├── __init__.py
│   ├── router.py
│   └── dependencies.py         # get_token_header
├── types/
│   └── ltree.py
└── utils/
    └── retrievability.py
```

**Target Test Structure:**
```
apps/api/tests/
├── conftest.py                 # Root fixtures (database, migrations, HTTP client)
├── test_health.py              # Health check tests
├── topics/
│   ├── conftest.py             # Topic-specific fixtures
│   ├── test_crud.py            # Basic CRUD tests
│   └── test_tree.py            # Hierarchy tests
├── sources/
│   ├── conftest.py
│   ├── test_crud.py
│   └── test_tree.py
├── reviews/
│   ├── conftest.py
│   ├── test_reviews.py
│   ├── entries/
│   │   └── test_entries.py
│   └── sessions/
│       └── test_sessions.py
└── auth/
    └── test_login.py
```

## What We're NOT Doing

1. **Not migrating models/schemas to domain folders** - Keeping them shared for now per user request
2. **Not adding new features** - Pure refactoring, maintaining existing behavior
3. **Not changing API contracts** - All endpoints remain the same
4. **Not separating FSRS logic** - Keeping all FSRS logic in `reviews/service.py` (pure functions interleave with database operations, separation adds complexity without benefit)
5. **Not adding new tests** - Only reorganizing existing tests

## Implementation Approach

The refactor will be done in 6 phases (1, 2, 3a, 3b, 4, 5) to maintain a working codebase at each step. Each phase builds on the previous one, with tests passing before moving forward.

**Key Principles:**
- Move tests alongside their code (not deferred to the end)
- Domain exceptions are pure Python exceptions (not HTTPException)
- Exception handlers translate domain exceptions to HTTP responses
- Service layer contains both business logic and data access
- Create directories just-in-time (not ahead of time)
- UserIdDep stays in root `dependencies.py` until Phase 5 (avoids import timing issues)

---

## Phase 1: Core Infrastructure

### Overview
Move core files to new locations and create shared infrastructure (exceptions, constants). No domain directories yet - those are created just-in-time in later phases.

### Changes Required

#### 1.1 Move and Rename Core Files
**Files to move:**
- `app/core/db.py` → `app/database.py`
- `app/core/config.py` → `app/config.py`

#### 1.2 Update Imports for Moved Files
Update all imports referencing the moved files:
- `from app.core.db import` → `from app.database import`
- `from app.core.config import` → `from app.config import`

#### 1.3 Create __init__.py for models/schemas
**Files to create:**
- `app/models/__init__.py` (with re-exports)
- `app/schemas/__init__.py` (with re-exports)

#### 1.4 Keep core/auth.py Until Phase 5
**Do NOT delete `app/core/` yet.** The `core/auth.py` file (WorkOS client initialization) is still needed by `dependencies.py` until Phase 5 when the `auth/` domain is created.

After moving `db.py` and `config.py`, the `core/` directory will contain only `auth.py`. This is intentional.

### Success Criteria

#### Automated Verification:
- [x] `uv run pytest` - All tests pass
- [x] `uv run ruff check` - No lint errors

#### Manual Verification:
- [x] `app/database.py` exists (moved from `core/db.py`)
- [x] `app/config.py` exists (moved from `core/config.py`)
- [x] `app/core/auth.py` still exists (will be moved in Phase 5)

---

## Phase 2: Exception Architecture

### Overview
Create domain exception classes (pure Python exceptions) and FastAPI exception handlers that translate them to HTTP responses. This decouples the service layer from HTTP concerns.

We use granular exception subclasses so that calling code can catch specific error types when needed (e.g., distinguishing cycle detection from duplicate children).

### Changes Required

#### 2.1 Create Domain Exception Classes
**File**: `app/exceptions.py`
```python
"""Domain exception classes.

These are pure Python exceptions, NOT HTTPExceptions.
They are translated to HTTP responses by exception handlers in main.py.

Usage:
    raise NotFoundError("Topic", topic_id)
    raise CycleDetectedError("topics")
    raise AlreadyExistsError("Topic is already a child")
    raise SelfReferenceError("Cannot relate topic to itself")
"""


class DomainError(Exception):
    """Base class for all domain exceptions."""
    pass


# --- 404 Not Found ---

class NotFoundError(DomainError):
    """Resource not found."""
    def __init__(self, resource: str, resource_id: int | str | None = None):
        self.resource = resource
        self.resource_id = resource_id
        detail = f"{resource} not found"
        if resource_id is not None:
            detail = f"{resource} with id {resource_id} not found"
        super().__init__(detail)


# --- 409 Conflict ---

class ConflictError(DomainError):
    """Base class for conflict errors (409)."""
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class CycleDetectedError(ConflictError):
    """Adding this relationship would create a cycle."""
    def __init__(self, entity_type: str = "entity"):
        super().__init__(f"Cannot add: would create cycle in {entity_type} hierarchy")


class AlreadyExistsError(ConflictError):
    """Resource or relationship already exists."""
    def __init__(self, detail: str):
        super().__init__(detail)


class HasChildrenError(ConflictError):
    """Cannot delete entity that has children without specifying a strategy."""
    def __init__(self, entity_type: str, count: int):
        super().__init__(
            f"{entity_type} has {count} children. "
            f"Specify child_handling_strategy: 'delete', 'orphan', or 'reparent'"
        )


class HasDependentsError(ConflictError):
    """Cannot delete entity that has dependent entities."""
    def __init__(self, entity_type: str, dependent_type: str, count: int):
        super().__init__(
            f"Cannot delete {entity_type}: {count} {dependent_type}(s) depend on it"
        )


# --- 400 Bad Request ---

class BadRequestError(DomainError):
    """Base class for bad request errors (400)."""
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class SelfReferenceError(BadRequestError):
    """Cannot create a self-referencing relationship."""
    def __init__(self, entity_type: str = "entity"):
        super().__init__(f"Cannot relate {entity_type} to itself")


class InvalidStateError(BadRequestError):
    """Operation not valid in current state."""
    def __init__(self, detail: str):
        super().__init__(detail)


# --- 401 Unauthorized ---

class AuthenticationError(DomainError):
    """Authentication failed (401)."""
    def __init__(self, detail: str = "Not authenticated"):
        self.detail = detail
        super().__init__(detail)


# --- 403 Forbidden ---

class ForbiddenError(DomainError):
    """Access denied (403)."""
    def __init__(self, detail: str = "Access denied"):
        self.detail = detail
        super().__init__(detail)
```

#### 2.2 Create Exception Handlers
**File**: `app/exception_handlers.py`
```python
"""FastAPI exception handlers that translate domain exceptions to HTTP responses.

Note: We only need handlers for base classes. Subclasses (CycleDetectedError,
AlreadyExistsError, etc.) inherit the handler from their parent class.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.exceptions import (
    NotFoundError,
    ConflictError,
    BadRequestError,
    AuthenticationError,
    ForbiddenError,
    DomainError,
)


async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": exc.detail},
    )


async def bad_request_handler(request: Request, exc: BadRequestError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.detail},
    )


async def authentication_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": exc.detail},
    )


async def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.detail},
    )


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Catch-all for unhandled domain errors."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"},
    )


def register_exception_handlers(app):
    """Register all exception handlers with the FastAPI app.

    Order matters: register specific classes before base classes.
    FastAPI matches the first registered handler for the exception type.
    """
    # Specific handlers (registered first)
    app.add_exception_handler(NotFoundError, not_found_handler)
    app.add_exception_handler(ConflictError, conflict_handler)
    app.add_exception_handler(BadRequestError, bad_request_handler)
    app.add_exception_handler(AuthenticationError, authentication_handler)
    app.add_exception_handler(ForbiddenError, forbidden_handler)
    # Catch-all (registered last)
    app.add_exception_handler(DomainError, domain_error_handler)
```

#### 2.3 Register Exception Handlers in main.py
Update `app/main.py` to register exception handlers:
```python
from app.exception_handlers import register_exception_handlers

app = FastAPI()
register_exception_handlers(app)
# ... rest of setup
```

#### 2.4 Create Shared Constants and Update Routers
**Order matters:** Create the constants file first, then update routers.

**Step 1: Create** `app/constants.py`
```python
from enum import Enum


class ChildHandlingStrategy(str, Enum):
    """Strategy for handling children when deleting a hierarchical entity."""
    DELETE = "delete"
    ORPHAN = "orphan"
    REPARENT = "reparent"
```

**Step 2: Update routers** (in order, testing after each):
- `app/routers/topics.py`: Remove `ChildHandlingStrategy` class, add `from app.constants import ChildHandlingStrategy`
- `app/routers/sources.py`: Remove `ChildHandlingStrategy` class, add `from app.constants import ChildHandlingStrategy`

**Step 3: Update tests** (if any import ChildHandlingStrategy from routers):
```bash
rg "from app.routers.topics import.*ChildHandlingStrategy" apps/api/tests/
rg "from app.routers.sources import.*ChildHandlingStrategy" apps/api/tests/
```

### Success Criteria

#### Automated Verification:
- [x] `uv run pytest` - All tests pass
- [x] `uv run ruff check` - No lint errors

#### Manual Verification:
- [x] Exception classes are pure Python (not HTTPException)
- [x] Exception handlers properly translate to HTTP responses
- [x] Constants consolidated in constants.py

---

## Phase 3a: Topics Domain (with Tests)

### Overview
Extract topics business logic into a service layer and move tests alongside the code.

### Changes Required

#### 3a.1 Create Topics Domain

**Create directory**: `app/topics/`

**File**: `app/topics/__init__.py` (empty)

**File**: `app/topics/service.py`
```python
"""Topic business logic and data access."""

from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Topic, Source
from app.exceptions import (
    NotFoundError,
    CycleDetectedError,
    AlreadyExistsError,
    HasChildrenError,
    SelfReferenceError,
)
from app.constants import ChildHandlingStrategy


async def get_topic(
    session: AsyncSession, topic_id: int, user_id: str
) -> Topic:
    """Get a topic or raise NotFoundError."""
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic", topic_id)
    return topic


async def is_descendant_of(
    session: AsyncSession, potential_descendant_id: int, ancestor_id: int
) -> bool:
    """Check if potential_descendant is a descendant of ancestor using ltree."""
    result = await session.execute(
        text("""
            SELECT EXISTS (
                SELECT 1 FROM topics d, topics a
                WHERE d.id = :descendant_id
                  AND a.id = :ancestor_id
                  AND d.path <@ a.path
            )
        """),
        {"descendant_id": potential_descendant_id, "ancestor_id": ancestor_id},
    )
    return result.scalar()


async def search_topics(...) -> list[Topic]:
    """Search topics with various filters."""
    # ... (extract from router)


async def list_topics(...) -> list[Topic]:
    """List topics with optional filters."""
    # ... (extract from router)


async def create_topic(...) -> Topic:
    """Create a new topic."""
    # ... (extract from router)


async def add_child(...) -> tuple[Topic, Topic]:
    """Add or create a child topic. Returns (parent, child)."""
    # Raises SelfReferenceError("topic") if parent_id == child_id
    # Raises CycleDetectedError("topics") if would create cycle
    # Raises AlreadyExistsError("Topic is already a child") if already child
    # ... (extract from router)


async def delete_topic(...) -> None:
    """Delete a topic with optional child handling strategy."""
    # Raises HasChildrenError("Topic", count) if has children and no strategy
    # ... (extract from router)


# ... remaining functions extracted from router
```

**File**: `app/topics/router.py`
```python
"""Topics HTTP endpoints - thin wrapper around service layer."""

from fastapi import APIRouter, Query

from app.dependencies import SessionDep, UserIdDep  # UserIdDep moves to auth/ in Phase 5
from app.schemas import TopicRead, TopicCreate, TopicUpdate, TopicSummaryRead
from app.constants import ChildHandlingStrategy
from app.topics import service

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/search/")
async def search_topics(
    session: SessionDep,
    user_id: UserIdDep,
    addable_as_parent_to: int | None = None,
) -> list[TopicSummaryRead]:
    return await service.search_topics(session, user_id, addable_as_parent_to=addable_as_parent_to)


# ... (thin wrappers for all other endpoints)
```

#### 3a.2 Move Tests
**Move files:**
- `tests/integration/test_topics.py` → `tests/topics/test_crud.py`
- `tests/integration/test_topics_tree.py` → `tests/topics/test_tree.py`

**Create**: `tests/topics/conftest.py` (move any topic-specific fixtures)

#### 3a.3 Update main.py
```python
from app.topics.router import router as topics_router

app.include_router(topics_router)
```

#### 3a.4 Update Test Imports
Update any test files that import from the old router path:
```bash
rg "from app.routers.topics" apps/api/tests/
```
Change `from app.routers.topics import` to appropriate new imports (e.g., `from app.constants import ChildHandlingStrategy`).

#### 3a.5 Verify No Remaining Imports and Remove Old Router
```bash
# Verify nothing imports from old path
rg "from app.routers.topics" apps/api/

# If clean, delete
rm apps/api/app/routers/topics.py
```

### Success Criteria

#### Automated Verification:
- [x] `uv run pytest tests/topics/` - Topics tests pass
- [x] `uv run pytest` - All tests pass
- [x] `uv run ruff check` - No lint errors

#### Manual Verification:
- [x] Router is thin (< 150 lines)
- [x] Service contains all business logic + data access
- [x] Tests are in `tests/topics/`

---

## Phase 3b: Sources Domain (with Tests)

### Overview
Extract sources business logic into a service layer and move tests alongside the code. Follows the same pattern established in Phase 3a.

### Changes Required

#### 3b.1 Create Sources Domain

**Create directory**: `app/sources/`

**File**: `app/sources/__init__.py` (empty)

**File**: `app/sources/service.py`
```python
"""Source business logic and data access."""

from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Source, Topic
from app.exceptions import (
    NotFoundError,
    CycleDetectedError,
    AlreadyExistsError,
    HasChildrenError,
    SelfReferenceError,
)
from app.constants import ChildHandlingStrategy


async def get_source(
    session: AsyncSession, source_id: int, user_id: str
) -> Source:
    """Get a source or raise NotFoundError."""
    stmt = select(Source).where(Source.id == source_id, Source.user_id == user_id)
    result = await session.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise NotFoundError("Source", source_id)
    return source


async def is_descendant_of(
    session: AsyncSession, potential_descendant_id: int, ancestor_id: int
) -> bool:
    """Check if potential_descendant is a descendant of ancestor using ltree."""
    result = await session.execute(
        text("""
            SELECT EXISTS (
                SELECT 1 FROM sources d, sources a
                WHERE d.id = :descendant_id
                  AND a.id = :ancestor_id
                  AND d.path <@ a.path
            )
        """),
        {"descendant_id": potential_descendant_id, "ancestor_id": ancestor_id},
    )
    return result.scalar()


# ... remaining functions extracted from router (same pattern as topics)
# Uses: SelfReferenceError, CycleDetectedError, AlreadyExistsError, HasChildrenError
```

**File**: `app/sources/router.py`
```python
"""Sources HTTP endpoints - thin wrapper around service layer."""

from fastapi import APIRouter, Query

from app.dependencies import SessionDep, UserIdDep  # UserIdDep moves to auth/ in Phase 5
from app.schemas import SourceRead, SourceCreate, SourceUpdate, SourceSummaryRead
from app.constants import ChildHandlingStrategy
from app.sources import service

router = APIRouter(prefix="/sources", tags=["sources"])


# ... (thin wrappers for all endpoints, same pattern as topics)
```

#### 3b.2 Move Tests
**Move files:**
- `tests/integration/test_sources.py` → `tests/sources/test_crud.py`
- `tests/integration/test_sources_tree.py` → `tests/sources/test_tree.py`

**Create**: `tests/sources/conftest.py` (move any source-specific fixtures)

#### 3b.3 Update main.py
```python
from app.sources.router import router as sources_router

app.include_router(sources_router)
```

#### 3b.4 Update Test Imports
Update any test files that import from the old router path:
```bash
rg "from app.routers.sources" apps/api/tests/
```

#### 3b.5 Verify No Remaining Imports and Remove Old Router
```bash
# Verify nothing imports from old path
rg "from app.routers.sources" apps/api/

# If clean, delete
rm apps/api/app/routers/sources.py
```

### Success Criteria

#### Automated Verification:
- [ ] `uv run pytest tests/sources/` - Sources tests pass
- [ ] `uv run pytest` - All tests pass
- [ ] `uv run ruff check` - No lint errors

#### Manual Verification:
- [ ] Router is thin (< 150 lines)
- [ ] Service contains all business logic + data access
- [ ] Tests are in `tests/sources/`

---

## Phase 4: Reviews Domain (with Tests)

### Overview
Extract reviews business logic including FSRS logic. This includes review entries and review sessions as sub-modules. All FSRS logic stays in service.py (the pure functions are interleaved with database operations, making separation impractical).

### Changes Required

#### 4.1 Create Reviews Directory Structure
```
app/reviews/
├── __init__.py
├── router.py
├── service.py           # Review CRUD + all FSRS logic
├── entries/
│   ├── __init__.py
│   ├── router.py
│   └── service.py
└── sessions/
    ├── __init__.py
    ├── router.py
    └── service.py
```

#### 4.2 Create Review Service
**File**: `app/reviews/service.py`
```python
"""Review business logic, data access, and FSRS logic.

FSRS helper functions are kept here (not in a separate module) because they're
tightly coupled with database operations in replay functions.
"""

from datetime import date, datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fsrs import Card, Rating as FSRSRating, Scheduler, State as FSRSState

from app.models import Review, Topic, Source
from app.exceptions import NotFoundError, AlreadyExistsError


# --- FSRS Helpers (pure functions, kept here for locality) ---

def map_rating_to_fsrs(rating: str) -> FSRSRating:
    """Map database rating string to FSRS Rating enum."""
    mapping = {
        "miss": FSRSRating.Again,
        "hard": FSRSRating.Hard,
        "good": FSRSRating.Good,
        "easy": FSRSRating.Easy,
    }
    return mapping[rating]


def map_state_to_fsrs(state: str) -> FSRSState:
    """Map database state string to FSRS State enum."""
    # ... (extract from router)


def map_fsrs_state_to_db(state: FSRSState) -> str:
    """Map FSRS State enum to database string."""
    # ... (extract from router)


def create_card_from_entity(entity: Topic | Source) -> Card:
    """Create an FSRS Card from a Topic or Source's current state."""
    # ... (extract from router)


def create_scheduler() -> Scheduler:
    """Create a new FSRS scheduler with default settings."""
    return Scheduler()


# --- Review Operations ---

async def get_review(session: AsyncSession, review_id: int, user_id: str) -> Review:
    """Get a review or raise NotFoundError."""
    # ...


async def replay_topic_reviews_from_date(
    session: AsyncSession, topic_id: int, user_id: str, from_date: date
) -> None:
    """Replay reviews for a topic starting from a specific date."""
    # ... (extract from router)


async def replay_source_reviews_from_date(
    session: AsyncSession, source_id: int, user_id: str, from_date: date
) -> None:
    """Replay reviews for a source starting from a specific date."""
    # ... (extract from router)


async def create_review(...) -> Review:
    """Create a new review with FSRS processing if completed."""
    # Raises AlreadyExistsError("Review already exists for this date") if duplicate
    # ... (extract from router)


# ... remaining functions
```

**File**: `app/reviews/router.py` (thin wrapper)

#### 4.3 Create Review Entries Sub-module
**File**: `app/reviews/entries/service.py`
```python
"""Review entry business logic."""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ReviewEntry
from app.exceptions import NotFoundError


async def get_entry(session: AsyncSession, entry_id: int, user_id: str) -> ReviewEntry:
    """Get a review entry or raise NotFoundError."""
    # ...


# ... remaining functions extracted from router
```

**File**: `app/reviews/entries/router.py` (thin wrapper)

#### 4.4 Create Review Sessions Sub-module
**File**: `app/reviews/sessions/service.py`
```python
"""Review session business logic."""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ReviewSession
from app.exceptions import NotFoundError, BadRequestError


async def get_session(session: AsyncSession, session_id: int, user_id: str) -> ReviewSession:
    """Get a review session or raise NotFoundError."""
    # ...


# ... remaining functions extracted from router
```

**File**: `app/reviews/sessions/router.py` (thin wrapper)

#### 4.5 Move Tests
**Move files:**
- `tests/integration/test_reviews.py` → `tests/reviews/test_reviews.py`
- Review entry tests (if any) → `tests/reviews/entries/test_entries.py`
- Review session tests (if any) → `tests/reviews/sessions/test_sessions.py`

**Create**: `tests/reviews/conftest.py`

#### 4.6 Update main.py
```python
from app.reviews.router import router as reviews_router
from app.reviews.entries.router import router as review_entries_router
from app.reviews.sessions.router import router as review_sessions_router

app.include_router(reviews_router)
app.include_router(review_entries_router)
app.include_router(review_sessions_router)
```

#### 4.7 Update Test Imports
Update any test files that import from old router paths:
```bash
rg "from app.routers.reviews" apps/api/tests/
rg "from app.routers.review_entries" apps/api/tests/
rg "from app.routers.review_sessions" apps/api/tests/
```

#### 4.8 Verify No Remaining Imports and Remove Old Routers
```bash
# Verify nothing imports from old paths
rg "from app.routers.review" apps/api/

# If clean, delete
rm apps/api/app/routers/reviews.py
rm apps/api/app/routers/review_entries.py
rm apps/api/app/routers/review_sessions.py
```

### Success Criteria

#### Automated Verification:
- [ ] `uv run pytest tests/reviews/` - Review tests pass
- [ ] `uv run pytest` - All tests pass
- [ ] `uv run ruff check` - No lint errors

#### Manual Verification:
- [ ] FSRS helper functions are in `service.py` (grouped at top with clear section comment)
- [ ] Entries and sessions are sub-modules of reviews
- [ ] Tests are in `tests/reviews/`

---

## Phase 5: Auth, Admin & Cleanup

### Overview
Extract auth and admin domains. Move remaining tests. Clean up old directories.

### Changes Required

#### 5.1 Create Auth Domain

**Create directory**: `app/auth/`

**File**: `app/auth/__init__.py` (empty)

**File**: `app/auth/workos.py`
Move from `app/core/auth.py`

**File**: `app/auth/dependencies.py`
```python
"""Auth dependencies."""

from typing import Annotated
from fastapi import Depends, Cookie

from app.exceptions import AuthenticationError
from app.auth.workos import workos_client


async def get_user_id(session_token: str | None = Cookie(None, alias="session")) -> str:
    """Get user ID from session token or raise AuthenticationError."""
    if not session_token:
        raise AuthenticationError("Not authenticated")
    # ... validate session with WorkOS
    return user_id


UserIdDep = Annotated[str, Depends(get_user_id)]
```

**File**: `app/auth/router.py`
Move from `app/routers/login.py`

#### 5.2 Create Admin Domain

**Create directory**: `app/admin/`

**File**: `app/admin/__init__.py` (empty)

**File**: `app/admin/dependencies.py`
```python
"""Admin dependencies."""

from fastapi import Header

from app.config import get_settings
from app.exceptions import ForbiddenError


async def get_token_header(x_token: str = Header(...)) -> str:
    """Validate admin token."""
    if x_token != get_settings().ADMIN_TOKEN:
        raise ForbiddenError("Invalid admin token")
    return x_token
```

**File**: `app/admin/router.py`
Move from `app/internal/admin.py`

#### 5.3 Update Root dependencies.py and Migrate UserIdDep

**Step 1: Remove UserIdDep from root dependencies.py**

**File**: `app/dependencies.py`
```python
"""Shared dependencies.

Note: UserIdDep is in app/auth/dependencies.py - import from there.
"""

from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

SessionDep = Annotated[AsyncSession, Depends(get_db)]
```

**Step 2: Update all domain routers to import UserIdDep from new location**

Update imports in:
- `app/topics/router.py`: `from app.dependencies import SessionDep, UserIdDep` → `from app.dependencies import SessionDep` + `from app.auth.dependencies import UserIdDep`
- `app/sources/router.py`: Same change
- `app/reviews/router.py`: Same change
- `app/reviews/entries/router.py`: Same change (if uses UserIdDep)
- `app/reviews/sessions/router.py`: Same change (if uses UserIdDep)

#### 5.4 Move Remaining Tests and Delete integration/ Directory
**Important:** This must be done atomically in a single commit. Git tracks moves, so do it all at once.

**Move files:**
- `tests/integration/test_health.py` → `tests/test_health.py`
- Any auth tests → `tests/auth/`

**Delete directory (same commit):**
```bash
rm -rf apps/api/tests/integration/
```

After this step, `tests/integration/` should no longer exist. The git commit will show the files as renames, not delete + create.

#### 5.5 Update main.py with All Routers
**File**: `app/main.py`
```python
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.exception_handlers import register_exception_handlers
from app.admin.dependencies import get_token_header
from app.topics.router import router as topics_router
from app.sources.router import router as sources_router
from app.reviews.router import router as reviews_router
from app.reviews.entries.router import router as review_entries_router
from app.reviews.sessions.router import router as review_sessions_router
from app.auth.router import router as auth_router
from app.admin.router import router as admin_router

app = FastAPI()

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().CORS_ALLOWED_ORIGINS_AS_STRINGS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(topics_router)
app.include_router(sources_router)
app.include_router(reviews_router)
app.include_router(review_entries_router)
app.include_router(review_sessions_router)
app.include_router(auth_router)
app.include_router(
    admin_router,
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_token_header)],
)


@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}
```

#### 5.6 Remove Old Directories
```bash
rm -rf apps/api/app/routers/
rm -rf apps/api/app/internal/
rm -rf apps/api/app/core/
```

Note:
- `tests/integration/` was already removed in step 5.4
- `app/core/` is now empty after moving `auth.py` to `app/auth/workos.py`

### Success Criteria

#### Automated Verification:
- [ ] `uv run pytest` - All tests pass
- [ ] `uv run ruff check` - No lint errors
- [ ] `uv run fastapi dev --host localhost` - Server starts

#### Manual Verification:
- [ ] `app/routers/` directory removed
- [ ] `app/internal/` directory removed
- [ ] `app/core/` directory removed
- [ ] `tests/integration/` directory removed (done in step 5.4)
- [ ] All endpoints work correctly

---

## Final Verification

After completing all phases, run these checks:

```bash
# Verify no orphaned files
find apps/api/app -name "*.py" | sort

# Run full test suite
uv run pytest -v

# Lint and format
uv run ruff check
uv run ruff format --check

# Verify server starts
uv run fastapi dev --host localhost
```

### Update Documentation
**Update `apps/api/CLAUDE.md`:**
```markdown
## Architecture

### Application Structure
- **`app/main.py`**: Main FastAPI application entry point
- **`app/config.py`**: Global configuration with Pydantic Settings
- **`app/database.py`**: Database connection setup
- **`app/dependencies.py`**: Shared dependencies (SessionDep)
- **`app/exceptions.py`**: Domain exception base classes
- **`app/exception_handlers.py`**: HTTP exception handlers
- **`app/constants.py`**: Shared constants (ChildHandlingStrategy)
- **`app/models/`**: SQLAlchemy ORM models (shared)
- **`app/schemas/`**: Pydantic validation schemas (shared)

### Domain Modules
Each domain follows this structure:
- `router.py` - Thin HTTP handlers
- `service.py` - Business logic + data access

Domains:
- **`app/topics/`**: Topic CRUD and hierarchy
- **`app/sources/`**: Source CRUD and hierarchy
- **`app/reviews/`**: Reviews + FSRS logic + entries/sessions sub-modules
- **`app/auth/`**: Authentication (WorkOS OAuth)
- **`app/admin/`**: Admin-only endpoints

### FSRS Architecture
- All FSRS logic is in `app/reviews/service.py`
- Pure helper functions (map_rating_to_fsrs, etc.) are grouped at the top of the file
- Replay operations use these helpers inline with database operations

### Utilities
- **`app/types/`**: Custom SQLAlchemy types (ltree)
- **`app/utils/`**: Utility functions
```

### Success Criteria
- [ ] `uv run pytest` - All tests pass
- [ ] `uv run ruff check` - No lint errors
- [ ] `uv run fastapi dev --host localhost` - Server starts
- [ ] Directory structure matches desired end state
- [ ] No tests lost in migration

---

## Circular Import Prevention

### Guidelines

To prevent circular imports in this structure:

1. **Services import from shared modules** - `service.py` imports from `app/exceptions.py`, `app/models/`, `app/schemas/`
2. **Routers import services** - `router.py` imports from `service.py` (and schemas)
3. **Never import routers from other modules**
4. **Cross-domain imports go through services** - If topics needs to call sources, import the service function

### Import Hierarchy
```
app/exceptions.py, app/models/, app/schemas/
                ↑
            service.py
                ↑
            router.py
```

### If Circular Imports Occur
1. Check if you're importing in the wrong direction
2. Consider moving shared types/interfaces to `app/constants.py` or a new shared module
3. Use `TYPE_CHECKING` blocks for type hints only:
```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.topics.service import SomeType
```

---

## Testing Strategy

- Run full test suite after each phase
- Tests should pass before moving to the next phase
- Move tests alongside their code (not deferred)
- Use git commits to checkpoint each phase
- All existing tests are preserved - no new tests (pure refactoring)

---

## Migration Notes

### Breaking Changes
- Internal import paths change (e.g., `app.routers.topics` → `app.topics.router`)
- Tests import paths change
- No API contract changes

### Rollback Plan
- Each phase is a separate git commit
- Can revert any phase independently
- Full rollback: revert to commit before Phase 1

---

## References

- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [Netflix Dispatch Project Structure](https://github.com/Netflix/dispatch)
- Current codebase exploration (see research above)
