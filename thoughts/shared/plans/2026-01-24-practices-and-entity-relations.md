# Practices Entity & Entity Relations Implementation Plan

## Overview

This plan implements Phase 3 (Practices Entity) and Phase 4 (Entity Relations & Prerequisites) of the Topic System Redesign. These phases complete the three-entity model (Topics, Sources, Practices) and add unified entity relations.

**Key Changes:**
- New entity: Practices (exercises with prompt/answer, no hierarchy)
- Junction tables: `practice_topics`, `practice_sources` for practice associations
- Polymorphic reviews: Add `practice_id` to reviews table
- Unified relations: `entity_relations` table (replacing `topic_other_relations`)
- Source prerequisites: `source_prerequisites` table

## Current State Analysis

### What's Already Implemented

**Phase 1 (Topics Foundation) - ✅ Completed**
- `fsrs_states` table with shared FSRS fields
- Topics with `parent_id`, `path` (ltree), `fsrs_state_id`
- `topic_other_relations` for topic↔topic relations
- Tree hierarchy with ltree for O(1) ancestry checks

**Phase 2 (Sources Entity) - ✅ Completed**
- `sources` table with tree hierarchy
- `source_topics` junction table
- Full backend: `apps/api/app/sources/` (router.py, service.py)
- Full frontend: `apps/web/src/features/sources/`
- Unified views: InboxPage, ArchivedPage, MyLibraryPage, RecentPage show both topics and sources

**Reviews Architecture (Deviation from Original Plan)**
The codebase uses **direct FK columns** on `reviews` table instead of association tables:
- `reviews.topic_id` (nullable)
- `reviews.source_id` (nullable)
- CHECK constraint: exactly one must be set
- Consolidated via migration `20260124213804_consolidate_review_associations.sql`

### File Locations

| Component | Path |
|-----------|------|
| Topics model | `apps/api/app/models/topics.py` |
| Sources model | `apps/api/app/models/sources.py` |
| Reviews model | `apps/api/app/models/reviews.py` |
| FsrsState model | `apps/api/app/models/fsrs_state.py` |
| Topics router | `apps/api/app/topics/router.py` |
| Sources router | `apps/api/app/sources/router.py` |
| Reviews router | `apps/api/app/reviews/router.py` |
| EntityCard component | `apps/web/src/components/EntityCard.tsx` |
| MyLibraryPage | `apps/web/src/app/pages/MyLibraryPage.tsx` |
| InboxPage | `apps/web/src/app/pages/InboxPage.tsx` |

## Desired End State

### Database Schema
- `practices` table with `prompt`, `answer`, `fsrs_state_id` (no hierarchy)
- `practice_topics` junction table
- `practice_sources` junction table
- `reviews.practice_id` column with updated CHECK constraint
- `entity_relations` table for topic↔topic, topic↔source, source↔source relations
- `source_prerequisites` table for prerequisite tracking

### Backend
- Practice model, schemas, router, service
- Updated reviews to support practice reviews
- Entity relations endpoints for topics and sources
- Source prerequisites endpoints

### Frontend
- `features/practices/` with full API layer and components
- PracticeCard, PracticeDetail components
- Create button with "New practice" option
- Inbox, Archived, MyLibrary, Recent pages show all three entity types
- EntityCard extended for practices

## What We're NOT Doing

- **Practices hierarchy**: Practices have no parent_id or tree structure
- **Practice relations**: Practices don't participate in entity_relations (only topics↔sources)
- **Separate list pages**: Using unified MyLibrary instead of My Topics/My Sources/My Practices

## Key Patterns to Follow

### Reviews Direct FK Pattern
Based on the consolidation migration, add `practice_id` as a third optional FK:
```sql
-- Extend CHECK constraint to include practice_id
ALTER TABLE reviews DROP CONSTRAINT reviews_entity_type_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_entity_type_check
CHECK ((topic_id IS NOT NULL)::int + (source_id IS NOT NULL)::int + (practice_id IS NOT NULL)::int = 1);
```

### Model Pattern (from sources.py)
```python
class Practice(Base):
    __tablename__ = "practices"
    # ... fields ...
    fsrs_state: Mapped["FsrsState | None"] = relationship("FsrsState", lazy="joined")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="practice")

    # FSRS field accessors (same pattern as Source/Topic)
    @property
    def stability(self) -> float | None:
        return self.fsrs_state.stability if self.fsrs_state else None
```

### Domain Module Structure
Following the domain-based architecture:
```
apps/api/app/practices/
├── router.py    # HTTP handlers
├── service.py   # Business logic + data access
```

### Frontend Feature Structure
```
apps/web/src/features/practices/
├── api/         # Query hooks and mutations
├── components/  # PracticeCard, PracticeDetail, etc.
├── types/       # TypeScript types and Valibot schemas
├── hooks/       # Feature-specific hooks
```

---

## Phase 3: Practices Entity - ✅ Completed

### Overview

Implement the complete Practices entity as a vertical slice: database, API, and frontend. Practices represent exercises and drills with prompt/answer fields. Unlike Topics and Sources, Practices have **no hierarchy**.

### Changes Required

#### 1. Create Practices Table and Junction Tables

**File**: `supabase/migrations/YYYYMMDD000001_create_practices.sql`

```sql
-- Practices table (no hierarchy - no parent_id or path)
CREATE TABLE practices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  inboxed BOOLEAN NOT NULL DEFAULT false,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Practice assesses Topic
CREATE TABLE practice_topics (
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (practice_id, topic_id)
);

-- Practice assesses Source
CREATE TABLE practice_sources (
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (practice_id, source_id)
);

-- Indexes
CREATE INDEX idx_practices_user ON practices(user_id);
CREATE INDEX idx_practices_fsrs ON practices(fsrs_state_id);
CREATE INDEX idx_practices_archived ON practices(archived) WHERE archived = false;
CREATE INDEX idx_practices_inboxed ON practices(inboxed) WHERE inboxed = true;
CREATE INDEX idx_practice_topics_topic ON practice_topics(topic_id);
CREATE INDEX idx_practice_sources_source ON practice_sources(source_id);

-- Triggers
CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practice_topics_updated_at BEFORE UPDATE ON practice_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practice_sources_updated_at BEFORE UPDATE ON practice_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update cleanup function to include practices (final version)
CREATE OR REPLACE FUNCTION cleanup_orphaned_fsrs_states()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM fsrs_states
  WHERE id = OLD.fsrs_state_id
    AND NOT EXISTS (SELECT 1 FROM topics WHERE fsrs_state_id = OLD.fsrs_state_id)
    AND NOT EXISTS (SELECT 1 FROM sources WHERE fsrs_state_id = OLD.fsrs_state_id)
    AND NOT EXISTS (SELECT 1 FROM practices WHERE fsrs_state_id = OLD.fsrs_state_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Cleanup orphaned fsrs_states when practice is deleted
CREATE TRIGGER cleanup_fsrs_after_practice_delete
  AFTER DELETE ON practices
  FOR EACH ROW
  WHEN (OLD.fsrs_state_id IS NOT NULL)
  EXECUTE FUNCTION cleanup_orphaned_fsrs_states();
```

**Rationale**: Practices are flat entities (no hierarchy) that link to both topics and sources. The cleanup function is updated to check all three entity types.

#### 2. Add practice_id to Reviews Table

**File**: `supabase/migrations/YYYYMMDD000002_add_practice_reviews.sql`

```sql
-- Add practice_id column to reviews
ALTER TABLE reviews ADD COLUMN practice_id BIGINT REFERENCES practices(id) ON DELETE CASCADE;
CREATE INDEX idx_reviews_practice_id ON reviews(practice_id);

-- Update CHECK constraint: exactly one of topic_id, source_id, or practice_id must be set
ALTER TABLE reviews DROP CONSTRAINT reviews_entity_type_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_entity_type_check
CHECK ((topic_id IS NOT NULL)::int + (source_id IS NOT NULL)::int + (practice_id IS NOT NULL)::int = 1);

-- Update trigger function to handle practice reviews
CREATE OR REPLACE FUNCTION update_entity_fsrs_on_review()
RETURNS TRIGGER AS $$
DECLARE
  v_fsrs_state_id BIGINT;
  v_entity_id BIGINT;
  v_entity_type TEXT;
  v_completed_at DATE;
BEGIN
  -- Determine entity type and ID
  IF TG_OP = 'DELETE' THEN
    IF OLD.topic_id IS NOT NULL THEN
      v_entity_id := OLD.topic_id;
      v_entity_type := 'topic';
      SELECT fsrs_state_id INTO v_fsrs_state_id FROM topics WHERE id = OLD.topic_id;
    ELSIF OLD.source_id IS NOT NULL THEN
      v_entity_id := OLD.source_id;
      v_entity_type := 'source';
      SELECT fsrs_state_id INTO v_fsrs_state_id FROM sources WHERE id = OLD.source_id;
    ELSIF OLD.practice_id IS NOT NULL THEN
      v_entity_id := OLD.practice_id;
      v_entity_type := 'practice';
      SELECT fsrs_state_id INTO v_fsrs_state_id FROM practices WHERE id = OLD.practice_id;
    END IF;
    v_completed_at := OLD.completed_at;
  ELSE
    IF NEW.topic_id IS NOT NULL THEN
      v_entity_id := NEW.topic_id;
      v_entity_type := 'topic';
      SELECT fsrs_state_id INTO v_fsrs_state_id FROM topics WHERE id = NEW.topic_id;
    ELSIF NEW.source_id IS NOT NULL THEN
      v_entity_id := NEW.source_id;
      v_entity_type := 'source';
      SELECT fsrs_state_id INTO v_fsrs_state_id FROM sources WHERE id = NEW.source_id;
    ELSIF NEW.practice_id IS NOT NULL THEN
      v_entity_id := NEW.practice_id;
      v_entity_type := 'practice';
      SELECT fsrs_state_id INTO v_fsrs_state_id FROM practices WHERE id = NEW.practice_id;
    END IF;
    v_completed_at := NEW.completed_at;
  END IF;

  IF v_fsrs_state_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' AND v_completed_at IS NOT NULL THEN
    PERFORM update_last_reviewed(v_fsrs_state_id, v_completed_at);
  ELSIF TG_OP = 'DELETE' AND v_completed_at IS NOT NULL THEN
    PERFORM recalc_last_reviewed(v_fsrs_state_id, v_entity_type, v_entity_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update recalc_last_reviewed to handle practices
CREATE OR REPLACE FUNCTION recalc_last_reviewed(
  p_fsrs_state_id BIGINT,
  p_entity_type TEXT,
  p_entity_id BIGINT
)
RETURNS VOID AS $$
DECLARE
  v_max_completed DATE;
BEGIN
  IF p_fsrs_state_id IS NULL THEN
    RETURN;
  END IF;

  -- Get max completed_at using direct FK column on reviews
  IF p_entity_type = 'topic' THEN
    SELECT MAX(completed_at) INTO v_max_completed
    FROM reviews
    WHERE topic_id = p_entity_id AND completed_at IS NOT NULL;
  ELSIF p_entity_type = 'source' THEN
    SELECT MAX(completed_at) INTO v_max_completed
    FROM reviews
    WHERE source_id = p_entity_id AND completed_at IS NOT NULL;
  ELSIF p_entity_type = 'practice' THEN
    SELECT MAX(completed_at) INTO v_max_completed
    FROM reviews
    WHERE practice_id = p_entity_id AND completed_at IS NOT NULL;
  END IF;

  UPDATE fsrs_states
  SET last_reviewed_at = v_max_completed
  WHERE id = p_fsrs_state_id;
END;
$$ LANGUAGE plpgsql;

-- Update refresh_last_reviewed_on_completion trigger
CREATE OR REPLACE FUNCTION refresh_last_reviewed_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_fsrs_state_id BIGINT;
  v_entity_id BIGINT;
  v_entity_type TEXT;
BEGIN
  -- Only act if completed_at changed
  IF NEW.completed_at IS NOT DISTINCT FROM OLD.completed_at THEN
    RETURN NEW;
  END IF;

  -- Check if it's a topic review
  IF NEW.topic_id IS NOT NULL THEN
    SELECT fsrs_state_id INTO v_fsrs_state_id FROM topics WHERE id = NEW.topic_id;
    v_entity_id := NEW.topic_id;
    v_entity_type := 'topic';
  -- Check if it's a source review
  ELSIF NEW.source_id IS NOT NULL THEN
    SELECT fsrs_state_id INTO v_fsrs_state_id FROM sources WHERE id = NEW.source_id;
    v_entity_id := NEW.source_id;
    v_entity_type := 'source';
  -- Check if it's a practice review
  ELSIF NEW.practice_id IS NOT NULL THEN
    SELECT fsrs_state_id INTO v_fsrs_state_id FROM practices WHERE id = NEW.practice_id;
    v_entity_id := NEW.practice_id;
    v_entity_type := 'practice';
  END IF;

  IF v_fsrs_state_id IS NOT NULL THEN
    IF NEW.completed_at IS NOT NULL THEN
      PERFORM update_last_reviewed(v_fsrs_state_id, NEW.completed_at);
    ELSE
      PERFORM recalc_last_reviewed(v_fsrs_state_id, v_entity_type, v_entity_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Rationale**: Extends the existing direct FK pattern to include practices. The CHECK constraint ensures exactly one entity type per review.

#### 3. Update Seed Data

**File**: `supabase/seed.sql`

Add sample practices with topic and source associations after the existing seed data.

```sql
-- Sample practices (add after existing topic/source seed data)
INSERT INTO practices (user_id, prompt, answer, inboxed) VALUES
('test-user-id', 'What is the time complexity of binary search?', 'O(log n) - the search space is halved with each comparison', false),
('test-user-id', 'Explain the difference between a stack and a queue', 'Stack: LIFO (Last In First Out). Queue: FIFO (First In First Out)', false),
('test-user-id', 'What is a closure in JavaScript?', 'A closure is a function that has access to variables from its outer scope, even after the outer function has returned', true);

-- Link practices to topics (use actual topic IDs from your seed data)
-- INSERT INTO practice_topics (practice_id, topic_id) VALUES (1, 1), (2, 1);

-- Link practices to sources
-- INSERT INTO practice_sources (practice_id, source_id) VALUES (1, 1);
```

#### 4. Create Practice Model

**File**: `apps/api/app/models/practices.py` (new)

```python
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Column,
    ForeignKey,
    Identity,
    Table,
    func,
    select,
    String,
    text,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP, Boolean, Text

from app.models.base import Base
from app.utils.retrievability import (
    calculate_retrievability,
    calculate_days_until_threshold,
)

if TYPE_CHECKING:
    from app.models.fsrs_state import FsrsState
    from app.models.reviews import Review
    from app.models.sources import Source
    from app.models.topics import Topic


# Define junction tables first
t_practice_topics = Table(
    "practice_topics",
    Base.metadata,
    Column(
        "practice_id",
        BigInteger,
        ForeignKey("practices.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "topic_id",
        BigInteger,
        ForeignKey("topics.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "inserted_at",
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    ),
    Column(
        "updated_at",
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    ),
)

t_practice_sources = Table(
    "practice_sources",
    Base.metadata,
    Column(
        "practice_id",
        BigInteger,
        ForeignKey("practices.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "source_id",
        BigInteger,
        ForeignKey("sources.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "inserted_at",
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    ),
    Column(
        "updated_at",
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    ),
)


class Practice(Base):
    __tablename__ = "practices"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    inserted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    answer: Mapped[str] = mapped_column(Text, nullable=False, server_default="")

    # FSRS state (shared table)
    fsrs_state_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("fsrs_states.id", ondelete="SET NULL"), unique=True
    )

    # Status flags
    archived: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    inboxed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    # Relationships
    fsrs_state: Mapped["FsrsState | None"] = relationship("FsrsState", lazy="joined")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="practice")

    # Topics this practice assesses
    topics: Mapped[list["Topic"]] = relationship(
        "Topic",
        secondary=t_practice_topics,
        viewonly=True,
    )

    # Sources this practice assesses
    sources: Mapped[list["Source"]] = relationship(
        "Source",
        secondary=t_practice_sources,
        viewonly=True,
    )

    # Computed property for retrievability
    @hybrid_property
    def retrievability(self) -> float | None:
        if self.fsrs_state is None:
            return None
        return calculate_retrievability(
            self.fsrs_state.stability, self.fsrs_state.last_reviewed_at
        )

    @property
    def days_until_threshold(self) -> int | None:
        if self.fsrs_state is None or self.fsrs_state.stability is None:
            return None
        return calculate_days_until_threshold(
            self.fsrs_state.stability,
            self.fsrs_state.last_reviewed_at,
            target_retrievability=0.9,
        )

    @property
    def bucket(self) -> str | None:
        days = self.days_until_threshold
        if days is None:
            return None
        if days < 0:
            return "LATE"
        elif days == 0:
            return "ON_TIME"
        else:
            return "EARLY"

    # FSRS field accessors for backward compatibility with schemas
    @property
    def stability(self) -> float | None:
        return self.fsrs_state.stability if self.fsrs_state else None

    @property
    def difficulty(self) -> float | None:
        return self.fsrs_state.difficulty if self.fsrs_state else None

    @property
    def state(self) -> str:
        return self.fsrs_state.state if self.fsrs_state else "LEARNING"

    @property
    def step(self) -> int | None:
        return self.fsrs_state.step if self.fsrs_state else None

    @property
    def last_reviewed_at(self):
        return self.fsrs_state.last_reviewed_at if self.fsrs_state else None

    @property
    def srs_enabled(self) -> bool:
        return self.fsrs_state.srs_enabled if self.fsrs_state else False

    @property
    def inherited_stability(self) -> float | None:
        return self.fsrs_state.inherited_stability if self.fsrs_state else None

    @property
    def inherited_difficulty(self) -> float | None:
        return self.fsrs_state.inherited_difficulty if self.fsrs_state else None

    @property
    def inherited_state(self) -> str | None:
        return self.fsrs_state.inherited_state if self.fsrs_state else None

    @property
    def inherited_step(self) -> int | None:
        return self.fsrs_state.inherited_step if self.fsrs_state else None

    @property
    def inherited_last_review(self):
        return self.fsrs_state.inherited_last_review if self.fsrs_state else None


# Count column properties
Practice.topics_count = column_property(
    select(func.count())
    .select_from(t_practice_topics)
    .where(t_practice_topics.c.practice_id == Practice.id)
    .correlate(Practice)
    .scalar_subquery()
)

Practice.sources_count = column_property(
    select(func.count())
    .select_from(t_practice_sources)
    .where(t_practice_sources.c.practice_id == Practice.id)
    .correlate(Practice)
    .scalar_subquery()
)
```

**Rationale**: Follows the exact pattern from `sources.py` but without parent/child hierarchy. Includes FSRS field accessors for schema compatibility.

#### 5. Update Reviews Model

**File**: `apps/api/app/models/reviews.py`

Add `practice_id` column and relationship:

```python
# Add import at top
if TYPE_CHECKING:
    from app.models.practices import Practice

# Add after source_id (around line 41)
practice_id: Mapped[int | None] = mapped_column(
    BigInteger, ForeignKey("practices.id", ondelete="CASCADE"), nullable=True
)

# Add relationship (around line 96)
practice: Mapped["Practice | None"] = relationship(back_populates="reviews")
```

#### 6. Update Topic and Source Models with practices_count

**File**: `apps/api/app/models/topics.py`

Add at the end of the file:

```python
# Import practice_topics table for practices_count
from app.models.practices import t_practice_topics  # noqa: E402

Topic.practices_count = column_property(
    select(func.count())
    .select_from(t_practice_topics)
    .where(t_practice_topics.c.topic_id == Topic.id)
    .correlate(Topic)
    .scalar_subquery()
)
```

**File**: `apps/api/app/models/sources.py`

Add at the end of the file:

```python
# Import practice_sources table for practices_count
from app.models.practices import t_practice_sources  # noqa: E402

Source.practices_count = column_property(
    select(func.count())
    .select_from(t_practice_sources)
    .where(t_practice_sources.c.source_id == Source.id)
    .correlate(Source)
    .scalar_subquery()
)
```

#### 7. Create Practice Schemas

**File**: `apps/api/app/schemas/practices.py` (new)

```python
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict

from app.schemas.topics import LearningState


class PracticeBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    prompt: str = ""
    answer: str = ""
    archived: bool = False
    inboxed: bool = False


class PracticeRead(PracticeBase):
    id: int
    fsrs_state_id: int | None = None
    inserted_at: datetime
    updated_at: datetime
    # FSRS fields
    stability: float | None = None
    difficulty: float | None = None
    state: LearningState | None = None
    step: int | None = None
    srs_enabled: bool = False
    last_reviewed_at: date | None = None
    inherited_stability: float | None = None
    inherited_difficulty: float | None = None
    inherited_state: LearningState | None = None
    inherited_step: int | None = None
    inherited_last_review: date | None = None
    # Computed
    retrievability: float | None = None
    bucket: str | None = None
    days_until_threshold: int | None = None


class PracticeSummaryRead(PracticeRead):
    topics_count: int = 0
    sources_count: int = 0


class PracticeDetailRead(PracticeRead):
    topics: list["TopicSummaryRead"] = []
    sources: list["SourceSummaryRead"] = []


class PracticeCreate(PracticeBase):
    srs_enabled: bool = False


class PracticeUpdate(BaseModel):
    prompt: str | None = None
    answer: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    srs_enabled: bool | None = None


class PracticeTopicAdd(BaseModel):
    topic_id: int


class PracticeSourceAdd(BaseModel):
    source_id: int


# Import for forward references
from app.schemas.topics import TopicSummaryRead  # noqa: E402
from app.schemas.sources import SourceSummaryRead  # noqa: E402

PracticeDetailRead.model_rebuild()
```

#### 8. Create Practice Service

**File**: `apps/api/app/practices/service.py` (new)

Following the pattern from `sources/service.py`:

```python
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.fsrs_state import FsrsState
from app.models.practices import Practice, t_practice_topics, t_practice_sources
from app.models.sources import Source
from app.models.topics import Topic
from app.schemas.practices import PracticeCreate, PracticeUpdate
from app.exceptions import NotFoundError, ConflictError


async def get_practice_or_404(
    session: AsyncSession, practice_id: int, user_id: str
) -> Practice:
    stmt = (
        select(Practice)
        .options(selectinload(Practice.fsrs_state))
        .where(Practice.id == practice_id, Practice.user_id == user_id)
    )
    result = await session.execute(stmt)
    practice = result.scalar_one_or_none()
    if practice is None:
        raise NotFoundError("Practice", practice_id)
    return practice


async def list_practices(
    session: AsyncSession,
    user_id: str,
    archived: bool | None = None,
    inboxed: bool | None = None,
    order: str = "desc",
    limit: int | None = None,
) -> list[Practice]:
    stmt = select(Practice).where(Practice.user_id == user_id)

    if archived is not None:
        stmt = stmt.where(Practice.archived == archived)
    if inboxed is not None:
        stmt = stmt.where(Practice.inboxed == inboxed)

    if order == "desc":
        stmt = stmt.order_by(Practice.updated_at.desc())
    else:
        stmt = stmt.order_by(Practice.updated_at.asc())

    if limit is not None:
        stmt = stmt.limit(limit)

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_practice_detail(
    session: AsyncSession, practice_id: int, user_id: str
) -> Practice:
    stmt = (
        select(Practice)
        .options(
            selectinload(Practice.fsrs_state),
            selectinload(Practice.topics),
            selectinload(Practice.sources),
        )
        .where(Practice.id == practice_id, Practice.user_id == user_id)
    )
    result = await session.execute(stmt)
    practice = result.scalar_one_or_none()
    if practice is None:
        raise NotFoundError("Practice", practice_id)
    return practice


async def create_practice(
    session: AsyncSession, user_id: str, data: PracticeCreate
) -> Practice:
    fsrs_state = None
    if data.srs_enabled:
        fsrs_state = FsrsState(srs_enabled=True)
        session.add(fsrs_state)
        await session.flush()

    practice = Practice(
        user_id=user_id,
        prompt=data.prompt,
        answer=data.answer,
        archived=data.archived,
        inboxed=data.inboxed,
        fsrs_state_id=fsrs_state.id if fsrs_state else None,
    )
    session.add(practice)
    await session.commit()
    await session.refresh(practice)
    return practice


async def update_practice(
    session: AsyncSession, practice: Practice, data: PracticeUpdate
) -> Practice:
    update_data = data.model_dump(exclude_unset=True)

    # Handle srs_enabled toggle
    if "srs_enabled" in update_data:
        if update_data["srs_enabled"] and practice.fsrs_state_id is None:
            fsrs_state = FsrsState(srs_enabled=True)
            session.add(fsrs_state)
            await session.flush()
            practice.fsrs_state_id = fsrs_state.id
        elif not update_data["srs_enabled"] and practice.fsrs_state:
            practice.fsrs_state.srs_enabled = False
        del update_data["srs_enabled"]

    for key, value in update_data.items():
        setattr(practice, key, value)

    await session.commit()
    await session.refresh(practice)
    return practice


async def delete_practice(session: AsyncSession, practice: Practice) -> None:
    await session.delete(practice)
    await session.commit()


async def add_topic_to_practice(
    session: AsyncSession, practice: Practice, topic_id: int, user_id: str
) -> None:
    # Verify topic exists and belongs to user
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()
    if topic is None:
        raise NotFoundError("Topic", topic_id)

    # Check if already linked
    stmt = select(t_practice_topics).where(
        t_practice_topics.c.practice_id == practice.id,
        t_practice_topics.c.topic_id == topic_id,
    )
    result = await session.execute(stmt)
    if result.first() is not None:
        raise ConflictError("Practice is already linked to this topic")

    await session.execute(
        t_practice_topics.insert().values(practice_id=practice.id, topic_id=topic_id)
    )
    await session.commit()


async def remove_topic_from_practice(
    session: AsyncSession, practice: Practice, topic_id: int
) -> None:
    result = await session.execute(
        delete(t_practice_topics).where(
            t_practice_topics.c.practice_id == practice.id,
            t_practice_topics.c.topic_id == topic_id,
        )
    )
    if result.rowcount == 0:
        raise NotFoundError("Practice-Topic link", topic_id)
    await session.commit()


async def add_source_to_practice(
    session: AsyncSession, practice: Practice, source_id: int, user_id: str
) -> None:
    # Verify source exists and belongs to user
    stmt = select(Source).where(Source.id == source_id, Source.user_id == user_id)
    result = await session.execute(stmt)
    source = result.scalar_one_or_none()
    if source is None:
        raise NotFoundError("Source", source_id)

    # Check if already linked
    stmt = select(t_practice_sources).where(
        t_practice_sources.c.practice_id == practice.id,
        t_practice_sources.c.source_id == source_id,
    )
    result = await session.execute(stmt)
    if result.first() is not None:
        raise ConflictError("Practice is already linked to this source")

    await session.execute(
        t_practice_sources.insert().values(practice_id=practice.id, source_id=source_id)
    )
    await session.commit()


async def remove_source_from_practice(
    session: AsyncSession, practice: Practice, source_id: int
) -> None:
    result = await session.execute(
        delete(t_practice_sources).where(
            t_practice_sources.c.practice_id == practice.id,
            t_practice_sources.c.source_id == source_id,
        )
    )
    if result.rowcount == 0:
        raise NotFoundError("Practice-Source link", source_id)
    await session.commit()


async def search_practices(
    session: AsyncSession,
    user_id: str,
    query: str | None = None,
    limit: int = 10,
) -> list[Practice]:
    stmt = (
        select(Practice)
        .where(Practice.user_id == user_id, Practice.archived == False)
    )

    if query:
        stmt = stmt.where(
            Practice.prompt.ilike(f"%{query}%") | Practice.answer.ilike(f"%{query}%")
        )

    stmt = stmt.order_by(Practice.updated_at.desc()).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())
```

#### 9. Create Practice Router

**File**: `apps/api/app/practices/router.py` (new)

```python
from fastapi import APIRouter

from app.dependencies import SessionDep, UserIdDep
from app.schemas.practices import (
    PracticeCreate,
    PracticeDetailRead,
    PracticeSummaryRead,
    PracticeUpdate,
    PracticeTopicAdd,
    PracticeSourceAdd,
)
from app.practices import service

router = APIRouter(prefix="/practices", tags=["practices"])


@router.get("/search/")
async def search_practices(
    session: SessionDep,
    user_id: UserIdDep,
    query: str | None = None,
    limit: int = 10,
) -> list[PracticeSummaryRead]:
    practices = await service.search_practices(session, user_id, query, limit)
    return [PracticeSummaryRead.model_validate(p) for p in practices]


@router.get("/")
async def list_practices(
    session: SessionDep,
    user_id: UserIdDep,
    archived: bool | None = None,
    inboxed: bool | None = None,
    order: str = "desc",
    limit: int | None = None,
) -> list[PracticeSummaryRead]:
    practices = await service.list_practices(
        session, user_id, archived, inboxed, order, limit
    )
    return [PracticeSummaryRead.model_validate(p) for p in practices]


@router.get("/{practice_id}/")
async def get_practice(
    session: SessionDep,
    user_id: UserIdDep,
    practice_id: int,
) -> PracticeDetailRead:
    practice = await service.get_practice_detail(session, practice_id, user_id)
    return PracticeDetailRead.model_validate(practice)


@router.post("/")
async def create_practice(
    session: SessionDep,
    user_id: UserIdDep,
    data: PracticeCreate,
) -> PracticeSummaryRead:
    practice = await service.create_practice(session, user_id, data)
    return PracticeSummaryRead.model_validate(practice)


@router.patch("/{practice_id}/")
async def update_practice(
    session: SessionDep,
    user_id: UserIdDep,
    practice_id: int,
    data: PracticeUpdate,
) -> PracticeSummaryRead:
    practice = await service.get_practice_or_404(session, practice_id, user_id)
    updated = await service.update_practice(session, practice, data)
    return PracticeSummaryRead.model_validate(updated)


@router.delete("/{practice_id}/", status_code=204)
async def delete_practice(
    session: SessionDep,
    user_id: UserIdDep,
    practice_id: int,
) -> None:
    practice = await service.get_practice_or_404(session, practice_id, user_id)
    await service.delete_practice(session, practice)


@router.get("/{practice_id}/topics/")
async def get_practice_topics(
    session: SessionDep,
    user_id: UserIdDep,
    practice_id: int,
) -> list:
    from app.schemas.topics import TopicSummaryRead
    practice = await service.get_practice_detail(session, practice_id, user_id)
    return [TopicSummaryRead.model_validate(t) for t in practice.topics]


@router.post("/{practice_id}/topics/")
async def add_topic_to_practice(
    session: SessionDep,
    user_id: UserIdDep,
    practice_id: int,
    data: PracticeTopicAdd,
) -> None:
    practice = await service.get_practice_or_404(session, practice_id, user_id)
    await service.add_topic_to_practice(session, practice, data.topic_id, user_id)


@router.delete("/{practice_id}/topics/{topic_id}/", status_code=204)
async def remove_topic_from_practice(
    session: SessionDep,
    user_id: UserIdDep,
    practice_id: int,
    topic_id: int,
) -> None:
    practice = await service.get_practice_or_404(session, practice_id, user_id)
    await service.remove_topic_from_practice(session, practice, topic_id)


@router.get("/{practice_id}/sources/")
async def get_practice_sources(
    session: SessionDep,
    user_id: UserIdDep,
    practice_id: int,
) -> list:
    from app.schemas.sources import SourceSummaryRead
    practice = await service.get_practice_detail(session, practice_id, user_id)
    return [SourceSummaryRead.model_validate(s) for s in practice.sources]


@router.post("/{practice_id}/sources/")
async def add_source_to_practice(
    session: SessionDep,
    user_id: UserIdDep,
    practice_id: int,
    data: PracticeSourceAdd,
) -> None:
    practice = await service.get_practice_or_404(session, practice_id, user_id)
    await service.add_source_to_practice(session, practice, data.source_id, user_id)


@router.delete("/{practice_id}/sources/{source_id}/", status_code=204)
async def remove_source_from_practice(
    session: SessionDep,
    user_id: UserIdDep,
    practice_id: int,
    source_id: int,
) -> None:
    practice = await service.get_practice_or_404(session, practice_id, user_id)
    await service.remove_source_from_practice(session, practice, source_id)
```

#### 10. Register Practice Router

**File**: `apps/api/app/main.py`

Add import and include router:

```python
from app.practices.router import router as practices_router

# Add with other router includes
app.include_router(practices_router)
```

#### 11. Update Reviews Router and Schemas

**File**: `apps/api/app/reviews/router.py`

Update to support practice reviews. Add `practice_id` filter parameter and handle practice review creation.

**File**: `apps/api/app/schemas/reviews.py`

Add `ReviewWithPractice` schema and update union types.

#### 11.5. Create Practice Tests

**Directory**: `apps/api/tests/practices/` (new)

Create comprehensive integration tests following the patterns in `tests/sources/test_crud.py` and `tests/topics/test_crud.py`.

**File**: `apps/api/tests/practices/__init__.py` (new)

Empty file for package.

**File**: `apps/api/tests/practices/test_crud.py` (new)

```python
"""Integration tests for practices endpoints."""

from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Practice


class TestPracticesEndpoints:
    """Integration tests for /practices endpoints."""

    async def test_list_practices_returns_empty_for_new_user(
        self,
        test_client: AsyncClient,
    ):
        """New user should have no practices."""
        response = await test_client.get("/practices/")

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_practices_returns_user_practices(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should return practices for the authenticated user."""
        await create_test_practice(prompt="My Test Practice")
        await create_test_practice(user_id="other-user", prompt="Other User Practice")

        response = await test_client.get("/practices/")

        assert response.status_code == 200
        practices = response.json()
        assert len(practices) == 1
        assert practices[0]["prompt"] == "My Test Practice"

    async def test_create_practice_success(
        self,
        test_client: AsyncClient,
    ):
        """Should create a new practice."""
        response = await test_client.post(
            "/practices/",
            json={
                "prompt": "What is 2 + 2?",
                "answer": "4",
                "srs_enabled": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["prompt"] == "What is 2 + 2?"
        assert data["answer"] == "4"
        assert data["id"] is not None

    async def test_get_practice_by_id(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should return a specific practice by ID."""
        practice = await create_test_practice(prompt="Specific Practice")

        response = await test_client.get(f"/practices/{practice.id}/")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == practice.id
        assert data["prompt"] == "Specific Practice"

    async def test_get_practice_not_found(
        self,
        test_client: AsyncClient,
    ):
        """Should return 404 for non-existent practice."""
        response = await test_client.get("/practices/99999/")

        assert response.status_code == 404

    async def test_delete_practice_success(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should delete a practice."""
        practice = await create_test_practice(prompt="Practice to Delete")

        response = await test_client.delete(f"/practices/{practice.id}/")
        assert response.status_code == 204

        # Verify practice is gone via API
        get_response = await test_client.get(f"/practices/{practice.id}/")
        assert get_response.status_code == 404

    async def test_update_practice_success(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should update a practice."""
        practice = await create_test_practice(prompt="Original Prompt")

        response = await test_client.patch(
            f"/practices/{practice.id}/",
            json={"prompt": "Updated Prompt"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["prompt"] == "Updated Prompt"

    async def test_list_practices_filter_by_archived(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should filter practices by archived status."""
        await create_test_practice(prompt="Active Practice", archived=False)
        await create_test_practice(prompt="Archived Practice", archived=True)

        # Get active only
        response = await test_client.get("/practices/?archived=false")
        assert response.status_code == 200
        practices = response.json()
        assert len(practices) == 1
        assert practices[0]["prompt"] == "Active Practice"

        # Get archived only
        response = await test_client.get("/practices/?archived=true")
        assert response.status_code == 200
        practices = response.json()
        assert len(practices) == 1
        assert practices[0]["prompt"] == "Archived Practice"

    async def test_list_practices_filter_by_inboxed(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should filter practices by inboxed status."""
        await create_test_practice(prompt="Library Practice", inboxed=False)
        await create_test_practice(prompt="Inbox Practice", inboxed=True)

        # Get inboxed only
        response = await test_client.get("/practices/?inboxed=true")
        assert response.status_code == 200
        practices = response.json()
        assert len(practices) == 1
        assert practices[0]["prompt"] == "Inbox Practice"

    async def test_search_practices(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should search practices by prompt and answer."""
        await create_test_practice(prompt="Binary search question", answer="O(log n)")
        await create_test_practice(prompt="Hash table question", answer="O(1)")

        # Search by prompt
        response = await test_client.get("/practices/search/?query=binary")
        assert response.status_code == 200
        practices = response.json()
        assert len(practices) == 1
        assert "Binary" in practices[0]["prompt"]

        # Search by answer
        response = await test_client.get("/practices/search/?query=O(1)")
        assert response.status_code == 200
        practices = response.json()
        assert len(practices) == 1
        assert "Hash" in practices[0]["prompt"]


class TestPracticeTopics:
    """Tests for practice-topic associations."""

    async def test_add_topic_to_practice(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
    ):
        """Should add a topic to a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        topic = await create_test_topic(name="Test Topic")

        response = await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic.id},
        )

        assert response.status_code == 200

        # Verify topic is linked
        detail_response = await test_client.get(f"/practices/{practice.id}/")
        data = detail_response.json()
        assert len(data["topics"]) == 1
        assert data["topics"][0]["id"] == topic.id

    async def test_remove_topic_from_practice(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
    ):
        """Should remove a topic from a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        topic = await create_test_topic(name="Test Topic")

        # Add topic first
        await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic.id},
        )

        # Remove topic
        response = await test_client.delete(
            f"/practices/{practice.id}/topics/{topic.id}/"
        )
        assert response.status_code == 204

        # Verify topic is unlinked
        detail_response = await test_client.get(f"/practices/{practice.id}/")
        data = detail_response.json()
        assert len(data["topics"]) == 0

    async def test_add_topic_to_practice_duplicate_fails(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
    ):
        """Should fail to add duplicate topic to practice."""
        practice = await create_test_practice(prompt="Test Practice")
        topic = await create_test_topic(name="Test Topic")

        # Add topic first time
        await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic.id},
        )

        # Try to add again
        response = await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": topic.id},
        )
        assert response.status_code == 409  # Conflict

    async def test_add_nonexistent_topic_fails(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should fail to add non-existent topic."""
        practice = await create_test_practice(prompt="Test Practice")

        response = await test_client.post(
            f"/practices/{practice.id}/topics/",
            json={"topic_id": 99999},
        )
        assert response.status_code == 404


class TestPracticeSources:
    """Tests for practice-source associations."""

    async def test_add_source_to_practice(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_source,
    ):
        """Should add a source to a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        source = await create_test_source(title="Test Source")

        response = await test_client.post(
            f"/practices/{practice.id}/sources/",
            json={"source_id": source.id},
        )

        assert response.status_code == 200

        # Verify source is linked
        detail_response = await test_client.get(f"/practices/{practice.id}/")
        data = detail_response.json()
        assert len(data["sources"]) == 1
        assert data["sources"][0]["id"] == source.id

    async def test_remove_source_from_practice(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_source,
    ):
        """Should remove a source from a practice."""
        practice = await create_test_practice(prompt="Test Practice")
        source = await create_test_source(title="Test Source")

        # Add source first
        await test_client.post(
            f"/practices/{practice.id}/sources/",
            json={"source_id": source.id},
        )

        # Remove source
        response = await test_client.delete(
            f"/practices/{practice.id}/sources/{source.id}/"
        )
        assert response.status_code == 204

        # Verify source is unlinked
        detail_response = await test_client.get(f"/practices/{practice.id}/")
        data = detail_response.json()
        assert len(data["sources"]) == 0


class TestPracticeReviews:
    """Tests for practice reviews."""

    async def test_create_practice_review(
        self,
        test_client: AsyncClient,
        create_test_practice,
    ):
        """Should create a review for a practice."""
        practice = await create_test_practice(prompt="Test Practice", srs_enabled=True)

        response = await test_client.post(
            "/reviews/",
            json={
                "practice_id": practice.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["practice_id"] == practice.id

    async def test_practice_review_updates_fsrs_state(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_practice,
    ):
        """Practice review should update FSRS state."""
        practice = await create_test_practice(prompt="Test Practice", srs_enabled=True)

        # Complete a review
        await test_client.post(
            "/reviews/",
            json={
                "practice_id": practice.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        # Verify FSRS state updated
        result = await db_session.execute(
            select(Practice)
            .where(Practice.id == practice.id)
            .options(selectinload(Practice.fsrs_state))
        )
        updated_practice = result.scalar_one()

        assert updated_practice.fsrs_state.stability is not None
        assert updated_practice.fsrs_state.difficulty is not None
        assert updated_practice.fsrs_state.last_reviewed_at is not None

    async def test_list_reviews_filter_by_practice(
        self,
        test_client: AsyncClient,
        create_test_practice,
        create_test_topic,
    ):
        """Should filter reviews by practice_id."""
        practice = await create_test_practice(prompt="Test Practice", srs_enabled=True)
        topic = await create_test_topic(name="Test Topic", srs_enabled=True)

        # Create practice review
        await test_client.post(
            "/reviews/",
            json={
                "practice_id": practice.id,
                "scheduled_at": str(date.today()),
            },
        )

        # Create topic review
        await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
            },
        )

        # Filter by practice
        response = await test_client.get(f"/reviews/?practice_id={practice.id}")
        assert response.status_code == 200
        reviews = response.json()
        assert len(reviews) == 1
        assert reviews[0]["practice_id"] == practice.id
```

**File**: `apps/api/tests/conftest.py` (update)

Add `create_test_practice` factory fixture:

```python
@pytest.fixture
def create_test_practice(db_session: AsyncSession, mock_user_id: str):
    """Factory fixture to create practices in the test database.

    Usage:
        practice = await create_test_practice(prompt="My Practice")
        practice = await create_test_practice(user_id="other-user", srs_enabled=False)
    """

    async def _create_practice(
        user_id: str | None = None,
        prompt: str = "Test Practice",
        answer: str = "Test Answer",
        srs_enabled: bool = True,
        archived: bool = False,
        inboxed: bool = False,
    ) -> Practice:
        from app.models import Practice, FsrsState

        # Use mock_user_id as default if not specified
        actual_user_id = user_id if user_id is not None else mock_user_id

        fsrs_state = None
        if srs_enabled:
            fsrs_state = FsrsState(srs_enabled=True)
            db_session.add(fsrs_state)
            await db_session.flush()

        practice = Practice(
            user_id=actual_user_id,
            prompt=prompt,
            answer=answer,
            archived=archived,
            inboxed=inboxed,
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
```

#### 12. Create Frontend Practice Feature

**Directory**: `apps/web/src/features/practices/`

Create the following structure mirroring the sources feature:

```
apps/web/src/features/practices/
├── api/
│   ├── queryKeys.ts
│   ├── getPractices.ts
│   ├── getPractice.ts
│   ├── createPractice.ts
│   ├── updatePractice.ts
│   ├── deletePractice.ts
│   ├── addPracticeTopic.ts
│   ├── removePracticeTopic.ts
│   ├── addPracticeSource.ts
│   └── removePracticeSource.ts
├── components/
│   ├── PracticeCard.tsx
│   ├── AddPracticeDialog.tsx
│   ├── DeletePracticeDialog.tsx
│   ├── PracticeActionMenu.tsx
│   ├── PracticeTopicsPanel.tsx
│   ├── PracticeSourcesPanel.tsx
│   └── PracticeDetail/
│       ├── PracticeDetail.tsx
│       ├── PracticeDetailHeader.tsx
│       ├── PracticeDetailSkeleton.tsx
│       ├── PracticeProperties.tsx
│       ├── PracticeReviewsSidebar.tsx
│       ├── PracticeStatus.tsx
│       └── PracticeTitleSection.tsx
├── types/
│   ├── practice.types.ts
│   ├── practice.schemas.ts
│   └── api.types.ts
├── hooks/
│   └── usePractice.ts
└── index.ts
```

#### 13. Create Practice TypeScript Types

**File**: `apps/web/src/features/practices/types/practice.types.ts`

```typescript
import type { LearningState, RetrievabilityBucket } from '~/features/topics/types/topic.types'

export type Practice = {
  id: number
  prompt: string
  answer: string
  fsrs_state_id: number | null
  inserted_at: string
  updated_at: string
  // FSRS fields
  stability: number | null
  difficulty: number | null
  state: LearningState | null
  step: number | null
  srs_enabled: boolean
  last_reviewed_at: string | null
  inherited_stability: number | null
  inherited_difficulty: number | null
  inherited_state: LearningState | null
  inherited_step: number | null
  inherited_last_review: string | null
  // Computed
  retrievability: number | null
  bucket: RetrievabilityBucket | null
  days_until_threshold: number | null
  // Counts
  topics_count?: number
  sources_count?: number
  // Relationships (for detail views)
  topics?: Topic[]
  sources?: Source[]
  archived: boolean
  inboxed: boolean
}

export type PracticeCreate = {
  prompt?: string
  answer?: string
  archived?: boolean
  inboxed?: boolean
  srs_enabled?: boolean
}

export type PracticeUpdate = {
  prompt?: string
  answer?: string
  archived?: boolean
  inboxed?: boolean
  srs_enabled?: boolean
}
```

#### 14. Update EntityCard Component

**File**: `apps/web/src/components/EntityCard.tsx`

Extend to support practices:

```typescript
import type { Practice } from '~/features/practices/types/practice.types'
import { PracticeCard } from '~/features/practices/components/PracticeCard'

export type EntityType = 'topic' | 'source' | 'practice'

export type EntityItem =
  | { type: 'topic'; item: Topic }
  | { type: 'source'; item: Source }
  | { type: 'practice'; item: Practice }

// In the switch statement:
case 'practice':
  return (
    <PracticeCard
      headerRight={headerRight}
      minHeight={minHeight}
      onPracticeClick={
        onEntityClick
          ? () => onEntityClick({ type: 'practice', item: entity.item })
          : undefined
      }
      searchQuery={searchQuery}
      showLeavingSoon={showLeavingSoon}
      practice={entity.item}
    />
  )

// Update getEntityTitle:
case 'practice':
  return entity.item.prompt || 'Untitled Practice'

// Update getEntityNotes:
// For practices, notes is the answer field
case 'practice':
  return entity.item.answer || ''
```

#### 15. Update Unified View Pages

**Files to update:**
- `apps/web/src/app/pages/InboxPage.tsx`
- `apps/web/src/app/pages/ArchivedPage.tsx`
- `apps/web/src/app/pages/MyLibraryPage.tsx`
- `apps/web/src/app/pages/RecentPage.tsx`

Each page needs to:
1. Import `usePractices` hook
2. Fetch practices with appropriate filters
3. Add practices to the combined entity list
4. Update navigation to handle `/practices/$practiceId`

Example for InboxPage:

```typescript
import { usePractices } from '~/features/practices/api/getPractices'

// In component:
const { data: practices, isLoading: practicesLoading } = usePractices({
  inboxed: true,
  archived: false,
})

// In entity combination:
const entityItems = useMemo(() => {
  const items: EntityItem[] = [
    ...(topics ?? []).map(t => ({ type: 'topic' as const, item: t })),
    ...(sources ?? []).map(s => ({ type: 'source' as const, item: s })),
    ...(practices ?? []).map(p => ({ type: 'practice' as const, item: p })),
  ]
  return items.sort((a, b) =>
    new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime()
  )
}, [topics, sources, practices])

// In navigation handler:
case 'practice':
  navigate({ to: '/practices/$practiceId', params: { practiceId: String(entity.item.id) } })
```

#### 16. Update MyLibrary Filter

**File**: `apps/web/src/app/pages/MyLibraryPage.tsx`

Add 'practice' to the filter options:

```typescript
const [activeFilters, setActiveFilters] = useState<EntityType[]>(['topic', 'source', 'practice'])

// In filter UI, add practice toggle
```

#### 17. Create Practice Routes

**File**: `apps/web/src/app/routes/_main/practices.tsx`

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/practices')({
  beforeLoad: () => {
    throw redirect({ to: '/home' })
  },
})
```

**File**: `apps/web/src/app/routes/_main/practices_.$practiceId.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { PracticeDetailPage } from '~/app/pages/PracticeDetailPage'

export const Route = createFileRoute('/_main/practices/$practiceId')({
  component: PracticeDetailPage,
})
```

#### 18. Create Practice Detail Page

**File**: `apps/web/src/app/pages/PracticeDetailPage.tsx`

Model after `SourceDetailPage.tsx` - displays practice prompt/answer, topics, sources, reviews.

#### 19. Update Create Button

**File**: `apps/web/src/app/components/AppSidebar/CreateButton.tsx`

Add "New practice" option:

```typescript
import { Dumbbell } from 'lucide-react'
import { AddPracticeDialog } from '~/features/practices/components/AddPracticeDialog'

// Add state
const [addPracticeDialogOpen, setAddPracticeDialogOpen] = useState(false)

// Add menu item after "New source"
<DropdownMenuItem onClick={() => setAddPracticeDialogOpen(true)}>
  <Dumbbell className="mr-2 h-4 w-4" />
  New practice
</DropdownMenuItem>

// Add dialog
<AddPracticeDialog
  context={{ type: 'standalone' }}
  onOpenChange={setAddPracticeDialogOpen}
  open={addPracticeDialogOpen}
/>
```

### Success Criteria

#### Automated Verification:
- [ ] Command: `cd apps/api && uv run pytest tests/practices/` - All practice CRUD tests pass
- [ ] Command: `cd apps/api && uv run pytest tests/` - All existing tests still pass (no regressions)
- [ ] Command: `cd apps/api && uv run ruff check --fix && uv run ruff format` - No lint errors
- [ ] Command: `cd apps/web && pnpm test:ci`
- [ ] Command: `cd apps/web && pnpm lint`
- [ ] Command: `cd apps/web && pnpm build`

#### Test Coverage (Phase 3):
The following test scenarios MUST pass before proceeding:
- [ ] Practice CRUD: create, read, update, delete operations
- [ ] Practice filtering: by archived, by inboxed status
- [ ] Practice search: by prompt and answer text
- [ ] Practice-Topic links: add, remove, duplicate prevention
- [ ] Practice-Source links: add, remove, duplicate prevention
- [ ] Practice reviews: create review, FSRS state updates
- [ ] User isolation: practices only visible to their owner

#### Claude in Chrome E2E Testing:
After automated verification passes, use Claude in Chrome to manually verify:
- [ ] Practice CRUD: create, view detail (prompt/answer), update, delete
- [ ] Practice-Topic links: add topic, view in detail, remove topic
- [ ] Practice-Source links: add source, view in detail, remove source
- [ ] Practice reviews: create review, complete with rating, verify FSRS updates
- [ ] Create button: shows all three entity types (topic, source, practice)
- [ ] Inbox page: shows topics, sources, and practices together sorted by updated_at
- [ ] Archived page: shows archived topics, sources, and practices together
- [ ] Recent page: shows all entity types
- [ ] My Library page: filter toggles work for all three entity types

**Implementation Note**: After automated verification, proceed directly to Claude in Chrome E2E testing. Pause for user review after E2E testing is complete before proceeding to Phase 4.

---

## Phase 4: Entity Relations & Prerequisites

### Overview

Implement the unified `entity_relations` table (replacing `topic_other_relations`) and `source_prerequisites` for prerequisite tracking. Entity relations support topic↔topic, topic↔source, and source↔source connections.

### Changes Required

#### 1. Create Entity Relations Table

**File**: `supabase/migrations/YYYYMMDD000010_create_entity_relations.sql`

```sql
-- Entity relations table for topic/source ↔ topic/source relations
CREATE TABLE entity_relations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  from_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  to_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  to_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Exactly one 'from' entity
  CONSTRAINT exactly_one_from CHECK (num_nonnulls(from_topic_id, from_source_id) = 1),
  -- Exactly one 'to' entity
  CONSTRAINT exactly_one_to CHECK (num_nonnulls(to_topic_id, to_source_id) = 1),
  -- No self-relations for same entity type
  CONSTRAINT no_self_relation CHECK (
    from_topic_id IS DISTINCT FROM to_topic_id
    AND from_source_id IS DISTINCT FROM to_source_id
  ),
  -- Unique relation (nulls handled correctly)
  CONSTRAINT unique_relation UNIQUE NULLS NOT DISTINCT (from_topic_id, from_source_id, to_topic_id, to_source_id)
);

-- Indexes for lookups
CREATE INDEX idx_entity_relations_from_topic ON entity_relations(from_topic_id) WHERE from_topic_id IS NOT NULL;
CREATE INDEX idx_entity_relations_from_source ON entity_relations(from_source_id) WHERE from_source_id IS NOT NULL;
CREATE INDEX idx_entity_relations_to_topic ON entity_relations(to_topic_id) WHERE to_topic_id IS NOT NULL;
CREATE INDEX idx_entity_relations_to_source ON entity_relations(to_source_id) WHERE to_source_id IS NOT NULL;

-- Migrate existing topic_other_relations data
INSERT INTO entity_relations (from_topic_id, to_topic_id, inserted_at, updated_at)
SELECT from_topic_id, to_topic_id, inserted_at, updated_at
FROM topic_other_relations;

-- Drop old table
DROP TABLE topic_other_relations;

-- Trigger for updated_at
CREATE TRIGGER update_entity_relations_updated_at BEFORE UPDATE ON entity_relations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Rationale**: Unified table handles all four combinations: topic→topic, topic→source, source→topic, source→source. CHECK constraints ensure exactly one from and one to entity.

#### 2. Create Source Prerequisites Table

**File**: `supabase/migrations/YYYYMMDD000011_create_source_prerequisites.sql`

```sql
-- Source prerequisites: what must be learned before a source
CREATE TABLE source_prerequisites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  prereq_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  prereq_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Exactly one prerequisite type
  CONSTRAINT exactly_one_prereq CHECK (num_nonnulls(prereq_topic_id, prereq_source_id) = 1),
  -- No self-prereq for sources
  CONSTRAINT no_self_prereq CHECK (source_id IS DISTINCT FROM prereq_source_id),
  -- Unique prerequisite
  CONSTRAINT unique_prereq UNIQUE NULLS NOT DISTINCT (source_id, prereq_topic_id, prereq_source_id)
);

-- Indexes
CREATE INDEX idx_source_prerequisites_source ON source_prerequisites(source_id);
CREATE INDEX idx_source_prerequisites_prereq_topic ON source_prerequisites(prereq_topic_id) WHERE prereq_topic_id IS NOT NULL;
CREATE INDEX idx_source_prerequisites_prereq_source ON source_prerequisites(prereq_source_id) WHERE prereq_source_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_source_prerequisites_updated_at BEFORE UPDATE ON source_prerequisites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Rationale**: Separate table for prerequisites allows sources to track what should be learned first. Prerequisites can be either topics or other sources.

#### 3. Update Seed Data

**File**: `supabase/seed.sql`

Add sample entity relations and source prerequisites.

```sql
-- Sample entity relations (add after practice seed data)
-- Topic to topic relations are migrated from topic_other_relations
-- Add some cross-entity relations:
-- INSERT INTO entity_relations (from_topic_id, to_source_id) VALUES (1, 1);
-- INSERT INTO entity_relations (from_source_id, to_topic_id) VALUES (1, 2);

-- Sample source prerequisites
-- INSERT INTO source_prerequisites (source_id, prereq_topic_id) VALUES (2, 1);
```

#### 4. Create Entity Relations Model

**File**: `apps/api/app/models/entity_relations.py` (new)

```python
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, Identity, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.sources import Source
    from app.models.topics import Topic


class EntityRelation(Base):
    __tablename__ = "entity_relations"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    from_topic_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    from_source_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("sources.id", ondelete="CASCADE"), nullable=True
    )
    to_topic_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    to_source_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("sources.id", ondelete="CASCADE"), nullable=True
    )
    inserted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )

    # Relationships for eager loading
    from_topic: Mapped["Topic | None"] = relationship(
        "Topic", foreign_keys=[from_topic_id]
    )
    from_source: Mapped["Source | None"] = relationship(
        "Source", foreign_keys=[from_source_id]
    )
    to_topic: Mapped["Topic | None"] = relationship(
        "Topic", foreign_keys=[to_topic_id]
    )
    to_source: Mapped["Source | None"] = relationship(
        "Source", foreign_keys=[to_source_id]
    )
```

#### 5. Create Source Prerequisites Model

**File**: `apps/api/app/models/source_prerequisites.py` (new)

```python
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, Identity, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.sources import Source
    from app.models.topics import Topic


class SourcePrerequisite(Base):
    __tablename__ = "source_prerequisites"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    source_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False
    )
    prereq_topic_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    prereq_source_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("sources.id", ondelete="CASCADE"), nullable=True
    )
    inserted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )

    # Relationships
    source: Mapped["Source"] = relationship("Source", foreign_keys=[source_id])
    prereq_topic: Mapped["Topic | None"] = relationship(
        "Topic", foreign_keys=[prereq_topic_id]
    )
    prereq_source: Mapped["Source | None"] = relationship(
        "Source", foreign_keys=[prereq_source_id]
    )
```

#### 6. Update Topic Model

**File**: `apps/api/app/models/topics.py`

Replace `t_topic_other_relations` with `entity_relations` relationships:

```python
from app.models.entity_relations import EntityRelation

# Remove t_topic_other_relations Table definition

# Update related_outgoing and related_incoming relationships to use EntityRelation
# This is more complex - need to use association proxy or custom loading

# For now, add relationship to EntityRelation for related entities
related_outgoing_relations: Mapped[list["EntityRelation"]] = relationship(
    "EntityRelation",
    foreign_keys="EntityRelation.from_topic_id",
    viewonly=True,
)
related_incoming_relations: Mapped[list["EntityRelation"]] = relationship(
    "EntityRelation",
    foreign_keys="EntityRelation.to_topic_id",
    viewonly=True,
)
```

#### 7. Update Source Model

**File**: `apps/api/app/models/sources.py`

Add entity relations and prerequisites relationships:

```python
from app.models.entity_relations import EntityRelation
from app.models.source_prerequisites import SourcePrerequisite

# Add relationships
related_outgoing_relations: Mapped[list["EntityRelation"]] = relationship(
    "EntityRelation",
    foreign_keys="EntityRelation.from_source_id",
    viewonly=True,
)
related_incoming_relations: Mapped[list["EntityRelation"]] = relationship(
    "EntityRelation",
    foreign_keys="EntityRelation.to_source_id",
    viewonly=True,
)
prerequisites: Mapped[list["SourcePrerequisite"]] = relationship(
    "SourcePrerequisite",
    foreign_keys="SourcePrerequisite.source_id",
    viewonly=True,
)
```

#### 8. Create Entity Relations Schemas

**File**: `apps/api/app/schemas/entity_relations.py` (new)

```python
from pydantic import BaseModel, ConfigDict, model_validator


class RelatedEntityRead(BaseModel):
    """Discriminated union for related entity (topic or source)"""
    model_config = ConfigDict(from_attributes=True)

    entity_type: str  # 'topic' or 'source'
    id: int
    name: str | None = None  # topic.name
    title: str | None = None  # source.title


class EntityRelationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_entity: RelatedEntityRead
    to_entity: RelatedEntityRead


class EntityRelationCreate(BaseModel):
    to_entity_type: str  # 'topic' or 'source'
    to_entity_id: int

    @model_validator(mode='after')
    def validate_entity_type(self):
        if self.to_entity_type not in ('topic', 'source'):
            raise ValueError("to_entity_type must be 'topic' or 'source'")
        return self


class SourcePrerequisiteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prereq_entity: RelatedEntityRead


class SourcePrerequisiteCreate(BaseModel):
    prereq_entity_type: str  # 'topic' or 'source'
    prereq_entity_id: int

    @model_validator(mode='after')
    def validate_entity_type(self):
        if self.prereq_entity_type not in ('topic', 'source'):
            raise ValueError("prereq_entity_type must be 'topic' or 'source'")
        return self
```

#### 9. Add Entity Relations Endpoints to Topics Router

**File**: `apps/api/app/topics/router.py`

Add endpoints:

```python
@router.post("/{topic_id}/related/")
async def add_related_to_topic(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int,
    data: EntityRelationCreate,
) -> None:
    """Add a related topic or source to this topic"""
    # Implementation in service

@router.delete("/{topic_id}/related/{entity_type}/{entity_id}/", status_code=204)
async def remove_related_from_topic(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int,
    entity_type: str,
    entity_id: int,
) -> None:
    """Remove a related topic or source from this topic"""
    # Implementation in service
```

#### 10. Add Entity Relations and Prerequisites Endpoints to Sources Router

**File**: `apps/api/app/sources/router.py`

Add endpoints:

```python
@router.post("/{source_id}/related/")
async def add_related_to_source(
    session: SessionDep,
    user_id: UserIdDep,
    source_id: int,
    data: EntityRelationCreate,
) -> None:
    """Add a related topic or source to this source"""

@router.delete("/{source_id}/related/{entity_type}/{entity_id}/", status_code=204)
async def remove_related_from_source(
    session: SessionDep,
    user_id: UserIdDep,
    source_id: int,
    entity_type: str,
    entity_id: int,
) -> None:
    """Remove a related topic or source from this source"""

@router.get("/{source_id}/prerequisites/")
async def get_source_prerequisites(
    session: SessionDep,
    user_id: UserIdDep,
    source_id: int,
) -> list[SourcePrerequisiteRead]:
    """Get prerequisites for this source"""

@router.post("/{source_id}/prerequisites/")
async def add_prerequisite_to_source(
    session: SessionDep,
    user_id: UserIdDep,
    source_id: int,
    data: SourcePrerequisiteCreate,
) -> None:
    """Add a prerequisite topic or source to this source"""

@router.delete("/{source_id}/prerequisites/{entity_type}/{entity_id}/", status_code=204)
async def remove_prerequisite_from_source(
    session: SessionDep,
    user_id: UserIdDep,
    source_id: int,
    entity_type: str,
    entity_id: int,
) -> None:
    """Remove a prerequisite from this source"""
```

#### 11. Update Frontend Types

**File**: `apps/web/src/features/topics/types/topic.types.ts`

Update related types to support both topics and sources:

```typescript
export type RelatedEntity =
  | { entity_type: 'topic'; id: number; name: string }
  | { entity_type: 'source'; id: number; title: string }

// Update TopicDetail to use RelatedEntity
related_outgoing?: RelatedEntity[]
related_incoming?: RelatedEntity[]
```

**File**: `apps/web/src/features/sources/types/source.types.ts`

Add related and prerequisites types:

```typescript
export type SourcePrerequisite = {
  id: number
  prereq_entity: RelatedEntity
}

// Update SourceDetail
related_outgoing?: RelatedEntity[]
related_incoming?: RelatedEntity[]
prerequisites?: SourcePrerequisite[]
```

#### 11.5. Create Entity Relations and Prerequisites Tests

**Directory**: `apps/api/tests/entity_relations/` (new)

Create comprehensive integration tests for entity relations and source prerequisites.

**File**: `apps/api/tests/entity_relations/__init__.py` (new)

Empty file for package.

**File**: `apps/api/tests/entity_relations/test_entity_relations.py` (new)

```python
"""Integration tests for entity relations endpoints."""

import pytest
from httpx import AsyncClient


class TestTopicEntityRelations:
    """Tests for topic entity relations (topic → topic/source)."""

    async def test_add_topic_to_topic_relation(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should add a related topic to a topic."""
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        response = await test_client.post(
            f"/topics/{topic1.id}/related/",
            json={"to_entity_type": "topic", "to_entity_id": topic2.id},
        )

        assert response.status_code == 200

        # Verify relation exists in topic detail
        detail_response = await test_client.get(f"/topics/{topic1.id}/")
        data = detail_response.json()
        related_outgoing = data.get("related_outgoing", [])
        assert any(r["id"] == topic2.id and r["entity_type"] == "topic" for r in related_outgoing)

    async def test_add_source_to_topic_relation(
        self,
        test_client: AsyncClient,
        create_test_topic,
        create_test_source,
    ):
        """Should add a related source to a topic."""
        topic = await create_test_topic(name="Test Topic")
        source = await create_test_source(title="Test Source")

        response = await test_client.post(
            f"/topics/{topic.id}/related/",
            json={"to_entity_type": "source", "to_entity_id": source.id},
        )

        assert response.status_code == 200

        # Verify relation exists
        detail_response = await test_client.get(f"/topics/{topic.id}/")
        data = detail_response.json()
        related_outgoing = data.get("related_outgoing", [])
        assert any(r["id"] == source.id and r["entity_type"] == "source" for r in related_outgoing)

    async def test_remove_topic_relation(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should remove a related topic from a topic."""
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        # Add relation first
        await test_client.post(
            f"/topics/{topic1.id}/related/",
            json={"to_entity_type": "topic", "to_entity_id": topic2.id},
        )

        # Remove relation
        response = await test_client.delete(
            f"/topics/{topic1.id}/related/topic/{topic2.id}/"
        )
        assert response.status_code == 204

        # Verify relation is gone
        detail_response = await test_client.get(f"/topics/{topic1.id}/")
        data = detail_response.json()
        related_outgoing = data.get("related_outgoing", [])
        assert not any(r["id"] == topic2.id for r in related_outgoing)

    async def test_no_self_relation(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should not allow topic to relate to itself."""
        topic = await create_test_topic(name="Test Topic")

        response = await test_client.post(
            f"/topics/{topic.id}/related/",
            json={"to_entity_type": "topic", "to_entity_id": topic.id},
        )

        assert response.status_code == 400  # Bad request or 409 Conflict

    async def test_duplicate_relation_fails(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Should not allow duplicate relations."""
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        # Add relation first time
        await test_client.post(
            f"/topics/{topic1.id}/related/",
            json={"to_entity_type": "topic", "to_entity_id": topic2.id},
        )

        # Try to add again
        response = await test_client.post(
            f"/topics/{topic1.id}/related/",
            json={"to_entity_type": "topic", "to_entity_id": topic2.id},
        )
        assert response.status_code == 409  # Conflict


class TestSourceEntityRelations:
    """Tests for source entity relations (source → topic/source)."""

    async def test_add_topic_to_source_relation(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
    ):
        """Should add a related topic to a source."""
        source = await create_test_source(title="Test Source")
        topic = await create_test_topic(name="Test Topic")

        response = await test_client.post(
            f"/sources/{source.id}/related/",
            json={"to_entity_type": "topic", "to_entity_id": topic.id},
        )

        assert response.status_code == 200

        # Verify relation exists
        detail_response = await test_client.get(f"/sources/{source.id}/")
        data = detail_response.json()
        related_outgoing = data.get("related_outgoing", [])
        assert any(r["id"] == topic.id and r["entity_type"] == "topic" for r in related_outgoing)

    async def test_add_source_to_source_relation(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should add a related source to a source."""
        source1 = await create_test_source(title="Source 1")
        source2 = await create_test_source(title="Source 2")

        response = await test_client.post(
            f"/sources/{source1.id}/related/",
            json={"to_entity_type": "source", "to_entity_id": source2.id},
        )

        assert response.status_code == 200

        # Verify relation exists
        detail_response = await test_client.get(f"/sources/{source1.id}/")
        data = detail_response.json()
        related_outgoing = data.get("related_outgoing", [])
        assert any(r["id"] == source2.id and r["entity_type"] == "source" for r in related_outgoing)

    async def test_no_self_relation_source(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should not allow source to relate to itself."""
        source = await create_test_source(title="Test Source")

        response = await test_client.post(
            f"/sources/{source.id}/related/",
            json={"to_entity_type": "source", "to_entity_id": source.id},
        )

        assert response.status_code == 400  # Bad request


class TestSourcePrerequisites:
    """Tests for source prerequisites."""

    async def test_add_topic_prerequisite(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
    ):
        """Should add a topic as prerequisite to a source."""
        source = await create_test_source(title="Test Source")
        prereq_topic = await create_test_topic(name="Prerequisite Topic")

        response = await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": prereq_topic.id},
        )

        assert response.status_code == 200

        # Verify prerequisite exists
        prereq_response = await test_client.get(f"/sources/{source.id}/prerequisites/")
        data = prereq_response.json()
        assert len(data) == 1
        assert data[0]["prereq_entity"]["id"] == prereq_topic.id
        assert data[0]["prereq_entity"]["entity_type"] == "topic"

    async def test_add_source_prerequisite(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should add a source as prerequisite to a source."""
        source = await create_test_source(title="Test Source")
        prereq_source = await create_test_source(title="Prerequisite Source")

        response = await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "source", "prereq_entity_id": prereq_source.id},
        )

        assert response.status_code == 200

        # Verify prerequisite exists
        prereq_response = await test_client.get(f"/sources/{source.id}/prerequisites/")
        data = prereq_response.json()
        assert len(data) == 1
        assert data[0]["prereq_entity"]["id"] == prereq_source.id
        assert data[0]["prereq_entity"]["entity_type"] == "source"

    async def test_remove_prerequisite(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
    ):
        """Should remove a prerequisite from a source."""
        source = await create_test_source(title="Test Source")
        prereq_topic = await create_test_topic(name="Prerequisite Topic")

        # Add prerequisite first
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": prereq_topic.id},
        )

        # Remove prerequisite
        response = await test_client.delete(
            f"/sources/{source.id}/prerequisites/topic/{prereq_topic.id}/"
        )
        assert response.status_code == 204

        # Verify prerequisite is gone
        prereq_response = await test_client.get(f"/sources/{source.id}/prerequisites/")
        data = prereq_response.json()
        assert len(data) == 0

    async def test_no_self_prerequisite(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should not allow source to be its own prerequisite."""
        source = await create_test_source(title="Test Source")

        response = await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "source", "prereq_entity_id": source.id},
        )

        assert response.status_code == 400  # Bad request

    async def test_duplicate_prerequisite_fails(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
    ):
        """Should not allow duplicate prerequisites."""
        source = await create_test_source(title="Test Source")
        prereq_topic = await create_test_topic(name="Prerequisite Topic")

        # Add prerequisite first time
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": prereq_topic.id},
        )

        # Try to add again
        response = await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": prereq_topic.id},
        )
        assert response.status_code == 409  # Conflict

    async def test_list_prerequisites_empty(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Should return empty list for source with no prerequisites."""
        source = await create_test_source(title="Test Source")

        response = await test_client.get(f"/sources/{source.id}/prerequisites/")

        assert response.status_code == 200
        assert response.json() == []

    async def test_multiple_prerequisites(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
    ):
        """Should support multiple prerequisites of different types."""
        source = await create_test_source(title="Advanced Source")
        prereq_topic1 = await create_test_topic(name="Basic Topic 1")
        prereq_topic2 = await create_test_topic(name="Basic Topic 2")
        prereq_source = await create_test_source(title="Intermediate Source")

        # Add multiple prerequisites
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": prereq_topic1.id},
        )
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": prereq_topic2.id},
        )
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "source", "prereq_entity_id": prereq_source.id},
        )

        # Verify all prerequisites exist
        prereq_response = await test_client.get(f"/sources/{source.id}/prerequisites/")
        data = prereq_response.json()
        assert len(data) == 3

        # Verify types
        topic_prereqs = [p for p in data if p["prereq_entity"]["entity_type"] == "topic"]
        source_prereqs = [p for p in data if p["prereq_entity"]["entity_type"] == "source"]
        assert len(topic_prereqs) == 2
        assert len(source_prereqs) == 1


class TestEntityRelationsCascade:
    """Tests for cascade behavior when entities are deleted."""

    async def test_relation_deleted_when_from_topic_deleted(
        self,
        test_client: AsyncClient,
        db_session,
        create_test_topic,
    ):
        """Relation should be deleted when 'from' topic is deleted."""
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        # Create relation
        await test_client.post(
            f"/topics/{topic1.id}/related/",
            json={"to_entity_type": "topic", "to_entity_id": topic2.id},
        )

        # Delete topic1
        await test_client.delete(f"/topics/{topic1.id}/")

        # topic2 should still exist and have no incoming relations
        detail_response = await test_client.get(f"/topics/{topic2.id}/")
        assert detail_response.status_code == 200
        data = detail_response.json()
        assert len(data.get("related_incoming", [])) == 0

    async def test_relation_deleted_when_to_entity_deleted(
        self,
        test_client: AsyncClient,
        create_test_topic,
        create_test_source,
    ):
        """Relation should be deleted when 'to' entity is deleted."""
        topic = await create_test_topic(name="Test Topic")
        source = await create_test_source(title="Test Source")

        # Create relation
        await test_client.post(
            f"/topics/{topic.id}/related/",
            json={"to_entity_type": "source", "to_entity_id": source.id},
        )

        # Delete source
        await test_client.delete(f"/sources/{source.id}/")

        # topic should have no outgoing relations
        detail_response = await test_client.get(f"/topics/{topic.id}/")
        data = detail_response.json()
        assert len(data.get("related_outgoing", [])) == 0

    async def test_prerequisite_deleted_when_prereq_deleted(
        self,
        test_client: AsyncClient,
        create_test_source,
        create_test_topic,
    ):
        """Prerequisite should be deleted when prerequisite entity is deleted."""
        source = await create_test_source(title="Test Source")
        prereq_topic = await create_test_topic(name="Prerequisite Topic")

        # Create prerequisite
        await test_client.post(
            f"/sources/{source.id}/prerequisites/",
            json={"prereq_entity_type": "topic", "prereq_entity_id": prereq_topic.id},
        )

        # Delete prerequisite topic
        await test_client.delete(f"/topics/{prereq_topic.id}/")

        # Source should have no prerequisites
        prereq_response = await test_client.get(f"/sources/{source.id}/prerequisites/")
        data = prereq_response.json()
        assert len(data) == 0
```

#### 12. Update Frontend Components

**File**: `apps/web/src/features/topics/components/TopicDetail/TopicRelatedPanel.tsx`

Update to display and manage both topic and source relations.

**File**: `apps/web/src/features/sources/components/SourceDetail/SourceRelatedPanel.tsx` (new)

Create panel for source relations.

**File**: `apps/web/src/features/sources/components/SourceDetail/SourcePrerequisitesPanel.tsx` (new)

Create panel for managing source prerequisites.

### Success Criteria

#### Automated Verification:
- [x] Command: `cd apps/api && uv run pytest tests/entity_relations/` - All entity relation tests pass
- [x] Command: `cd apps/api && uv run pytest tests/` - All existing tests still pass (no regressions)
- [x] Command: `cd apps/api && uv run ruff check --fix && uv run ruff format` - No lint errors
- [x] Command: `cd apps/web && pnpm test:ci`
- [x] Command: `cd apps/web && pnpm lint`
- [x] Command: `cd apps/web && pnpm build`

#### Test Coverage (Phase 4):
The following test scenarios MUST pass before proceeding:
- [x] Topic → Topic relations: add, remove, no self-relation, no duplicates
- [x] Topic → Source relations: add, remove
- [x] Source → Topic relations: add, remove
- [x] Source → Source relations: add, remove, no self-relation
- [x] Source prerequisites (topic): add, remove, list, no duplicates
- [x] Source prerequisites (source): add, remove, no self-prerequisite
- [x] Multiple prerequisites per source
- [x] Cascade deletion: relations removed when entities deleted
- [x] Migration: existing topic_other_relations data preserved

#### Claude in Chrome E2E Testing:
After automated verification passes, use Claude in Chrome to manually verify:
- [x] Topic → Topic relations: add, view in related panel, remove (existing functionality preserved)
- [ ] Topic → Source relations: add source as related, view in panel, remove (API works, frontend TopicRelatedPanel not updated)
- [ ] Source → Topic relations: add topic as related, view in panel, remove (API works, frontend SourceRelatedPanel not created)
- [ ] Source → Source relations: add source as related, view in panel, remove (API works, frontend SourceRelatedPanel not created)
- [x] Source prerequisites (topic): add topic prereq, view in prerequisites panel, remove
- [x] Source prerequisites (source): add source prereq, view in panel, remove
- [ ] Related panel UI: correctly distinguishes topics vs sources (different icons/labels) (Prerequisites panel shows type labels)
- [x] Prerequisites panel: visible on source detail page, shows both topic and source prereqs

---

## Testing Strategy

### API Integration Tests

The API uses pytest with testcontainers for integration testing against real PostgreSQL. Tests follow this structure:

**Test Organization:**
```
apps/api/tests/
├── conftest.py           # Shared fixtures (db, client, factories)
├── practices/            # NEW - Phase 3 tests
│   ├── __init__.py
│   └── test_crud.py      # Practice CRUD, topics, sources, reviews
├── entity_relations/     # NEW - Phase 4 tests
│   ├── __init__.py
│   └── test_entity_relations.py  # Relations, prerequisites, cascade
├── sources/
├── topics/
└── reviews/
```

**Running Tests:**
```bash
cd apps/api

# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/practices/test_crud.py

# Run specific test class
uv run pytest tests/practices/test_crud.py::TestPracticesEndpoints

# Run with verbose output
uv run pytest -v

# Run with print statements shown
uv run pytest -s
```

**Key Testing Patterns:**

1. **Factory Fixtures** (`conftest.py`):
   - `create_test_topic` - creates topics with optional FSRS state
   - `create_test_source` - creates sources with optional FSRS state
   - `create_test_practice` - NEW: creates practices (Phase 3)
   - These handle user isolation and database cleanup automatically

2. **Test Client**:
   - `test_client` fixture provides authenticated HTTP client
   - Uses `mock_user_id` fixture for auth (default: `test-user-123`)
   - Override `mock_user_id` to test multi-user scenarios

3. **Database Session**:
   - `db_session` fixture for direct database access
   - Uses nested transactions for automatic rollback
   - Each test starts with clean state

### Database Migration Testing

1. **Apply migrations locally:**
   ```bash
   cd supabase
   supabase migration up
   ```

2. **Verify schema changes:**
   ```bash
   supabase db diff
   ```

3. **Reset and seed for testing:**
   ```bash
   supabase db reset
   ```

### Frontend Testing

The web app uses Vitest for unit/integration tests:

```bash
cd apps/web

# Run tests in watch mode
pnpm test

# Run tests once (CI mode)
pnpm test:ci

# Run specific test file
pnpm test src/features/practices
```

**Note:** Frontend tests are minimal in this codebase. Focus API testing effort on integration tests.

### Commit Strategy

Commit changes incrementally:
1. Database migrations (each migration file)
2. Backend models and schemas
3. Backend router and service
4. Frontend types and API layer
5. Frontend components and pages

**Example commit sequence for Phase 3:**
```
feat(api): add practices table migration
feat(api): add practice_id to reviews migration
feat(api): add Practice model and schemas
feat(api): add practices router and service
feat(web): add practices feature types and API
feat(web): add PracticeCard and PracticeDetail components
feat(web): update EntityCard to support practices
feat(web): add practices to unified view pages
feat(web): add practice creation to CreateButton
```

---

## References

- Original plan: `thoughts/shared/plans/2026-01-17-topic-system-redesign.md`
- Review consolidation migration: `supabase/migrations/20260124213804_consolidate_review_associations.sql`
- Sources implementation: `apps/api/app/sources/`, `apps/web/src/features/sources/`
- Topics implementation: `apps/api/app/topics/`, `apps/web/src/features/topics/`
