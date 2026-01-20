# Topic System Redesign Implementation Plan

## Overview

This plan implements a major schema and API redesign that introduces three distinct entity types (Topics, Sources, Practices) to replace the current single-entity model. The implementation is structured as 5 vertical slices, each delivering end-to-end functionality validated by Claude in Chrome E2E testing.

**Key Changes:**
- New entity types: Sources (learning materials) and Practices (exercises)
- Simplified topic hierarchy: DAG (closure table) → Tree (parent_id + ltree path)
- Shared FSRS state: Embedded fields → Shared `fsrs_states` table with inherited fields preserved
- Unified relations: `topic_other_relations` → `entity_relations` (topic/source ↔ topic/source)
- Polymorphic reviews: Direct `topic_id` → Association tables (`topic_reviews`, `source_reviews`, `practice_reviews`)

## Current State Analysis

### Database Schema
- **Topics table**: Single entity with FSRS fields embedded (`stability`, `difficulty`, `state`, `step`, `last_reviewed_at`, `inherited_*`)
- **Hierarchy**: `topics_closure` table implementing DAG with `ancestor`, `descendant`, `depth`, `count`
- **Relations**: `topic_other_relations` for topic↔topic only
- **Reviews**: `reviews.topic_id` required FK, FSRS snapshots stored on review

### Backend (FastAPI)
- **Models**: `apps/api/app/models/topics.py` - Topic model with closure table joins
- **Schemas**: `apps/api/app/schemas/topics.py` - FSRS fields flattened on TopicRead
- **Router**: `apps/api/app/routers/topics.py` - Uses stored procedures for hierarchy ops

### Frontend (React)
- **Routing**: TanStack Router with file-based routes in `apps/web/src/app/routes/`
- **Pages**: MyTopicsPage, TopicDetailPage, InboxPage, etc.
- **Components**: TopicCard, TopicDetail, MasonryLayout, PageLayout
- **API Layer**: TanStack Query with Valibot validation in `features/topics/`

## Desired End State

### Database Schema
- **Three core tables**: `topics`, `sources`, `practices` with `parent_id` (tree) and `fsrs_state_id`
- **Shared FSRS**: `fsrs_states` table with inherited fields (`inherited_stability`, etc.)
- **Unified relations**: `entity_relations` for topic/source ↔ topic/source
- **Junction tables**: `source_topics`, `practice_topics`, `practice_sources`, `source_prerequisites`
- **Polymorphic reviews**: `topic_reviews`, `source_reviews`, `practice_reviews` association tables

### Backend
- **Models**: Separate models for Topic, Source, Practice, FsrsState
- **Schemas**: `*SummaryRead` (with counts), `*DetailRead` (with relationships)
- **Routers**: `/topics`, `/sources`, `/practices`, `/reviews` (polymorphic)

### Frontend
- **Unified entity UI**: Topics, Sources, Practices as equal primary entities
- **Shared components**: EntityCard, EntityDetail adaptable to all three types
- **Feature folders**: `features/topics/`, `features/sources/`, `features/practices/`

## Key Discoveries

1. **Closure table functions**: `insert_relationship()` and `delete_relationship()` are PostgreSQL stored procedures that handle transitive closure - these will be removed
2. **Inherited FSRS fields**: Currently on Topic model - will move to `fsrs_states` table. **Propagation happens at entity creation time** when the user enables the "inherit" option in AddTopicDialog/AddSourceDialog. The inherited fields are set once from the parent's current FSRS state; they are not automatically updated when the parent's state changes.
3. **Review trigger**: `trg_update_topic_last_reviewed_at` updates `topics.last_reviewed_at` - needs update for polymorphic reviews
4. **Frontend patterns**: Feature-based architecture with query keys factory, Valibot schemas, mutation invalidation
5. **E2E testing**: Use Claude in Chrome for manual E2E verification after each phase
6. **ltree extension**: Added for O(1) ancestry/descendant checks via materialized path (`path` column). Not in original schema docs but necessary for efficient cycle detection and subtree queries.

## Loading Patterns (asyncpg)

The API uses SQLAlchemy's async ORM with asyncpg. Key patterns to follow:

### Relationship Loading: `selectinload`

Use `selectinload` for eager loading relationships (async-compatible, issues separate SELECT per relationship):

```python
# Basic pattern
stmt = select(Topic).options(
    selectinload(Topic.children),
    selectinload(Topic.fsrs_state),
)

# Chained for nested relationships
stmt = select(Topic).options(
    selectinload(Topic.children).selectinload(Topic.children),  # children's children
)
```

### Relationship Counts: `column_property` with Scalar Subquery

For `*SummaryRead` schemas that need counts without loading full objects, use `column_property` with correlated subqueries:

```python
# In the model (apps/api/app/models/topics.py)
from sqlalchemy.orm import column_property
from sqlalchemy import select, func

class Topic(Base):
    # ... existing fields ...

    # Count of direct children (available in Phase 1)
    children_count: Mapped[int] = column_property(
        select(func.count())
        .select_from(Topic)
        .where(Topic.parent_id == id)
        .correlate_except(Topic)
        .scalar_subquery()
    )

    # Count of sources covering this topic (add in Phase 2 after source_topics exists)
    # sources_count: Mapped[int] = column_property(
    #     select(func.count())
    #     .select_from(source_topics)
    #     .where(source_topics.c.topic_id == id)
    #     .correlate_except(source_topics)
    #     .scalar_subquery()
    # )

    # Count of practices assessing this topic (add in Phase 3 after practice_topics exists)
    # practices_count: Mapped[int] = column_property(
    #     select(func.count())
    #     .select_from(practice_topics)
    #     .where(practice_topics.c.topic_id == id)
    #     .correlate_except(practice_topics)
    #     .scalar_subquery()
    # )
```

**Key points:**
- Use `.correlate_except()` to ensure proper correlation with outer query
- Returns `.scalar_subquery()` for embedding in SELECT
- Counts are computed per-row, not N+1 queries
- These become regular attributes on the model, automatically included in SELECT
- **Important:** Add count properties incrementally as tables are created:
  - Phase 1: `children_count`, `related_outgoing_count`, `related_incoming_count`
  - Phase 2: Add `sources_count` after `source_topics` table exists
  - Phase 3: Add `practices_count` after `practice_topics` table exists

### Computed Properties: `@hybrid_property`

For instance-level computed values that don't require database queries:

```python
@hybrid_property
def retrievability(self) -> float | None:
    if self.fsrs_state is None:
        return None
    return calculate_retrievability(
        self.fsrs_state.stability,
        self.fsrs_state.last_reviewed_at
    )
```

### Loading Summary vs Detail

```python
# List endpoint: load counts only (no relationships)
async def list_topics(...) -> list[TopicSummaryRead]:
    stmt = select(Topic).options(selectinload(Topic.fsrs_state))
    # children_count, sources_count, etc. auto-loaded via column_property
    ...

# Detail endpoint: load full relationships
async def get_topic(...) -> TopicDetailRead:
    stmt = select(Topic).options(
        selectinload(Topic.fsrs_state),
        selectinload(Topic.children).selectinload(Topic.fsrs_state),
        selectinload(Topic.parent).selectinload(Topic.fsrs_state),
        selectinload(Topic.sources),
        selectinload(Topic.practices),
        selectinload(Topic.related_outgoing),
        selectinload(Topic.related_incoming),
    )
    ...
```

## What We're NOT Doing

- **API versioning**: Keeping v1, breaking changes acceptable
- **User-guided migration**: Automated migration with first-parent strategy
- **Bidirectional relations**: Relations remain directional (from → to)
- **Nested UI structure**: Not nesting Sources/Practices under Topics - they are equal entities

## Seed Data Maintenance

**Important:** The seed file (`supabase/seed.sql`) must be updated alongside schema migrations to remain compatible with the new schema. After each phase:

1. Update `supabase/seed.sql` to match the new schema structure
2. Verify seed data works with `supabase db reset` (applies migrations + seed)
3. Test that the application functions correctly with seeded data

**Phase-specific seed updates:**
- **Phase 1:** Update topic seed data to use `fsrs_state_id` instead of inline FSRS fields; remove closure table seed data
- **Phase 2:** Add sample sources with `source_topics` relationships
- **Phase 3:** Add sample practices with `practice_topics` and `practice_sources` relationships
- **Phase 4:** Add sample `entity_relations` and `source_prerequisites`
- **Phase 5:** Ensure review seed data uses association tables (`topic_reviews`, etc.)

## UI Design Decisions

### Create Button
The sidebar Create dropdown expands to include all three entity types:
- New topic
- New source
- New practice
- New review (existing)

### Inbox & Archived Pages
Inbox and Archived pages show ALL entity types (topics, sources, practices) in a unified view:
- Mixed masonry grid with entity-specific cards
- Filter options to show specific types if needed
- Each card clearly indicates its entity type

### Home Page Changes
- **Rename**: "Recent Topics" → "Recent" showing all entity types (topics, sources, practices)

### Sidebar Navigation
```
Sidebar:
├── Home
├── Review (consolidated hub)
├── (space)
├── Inbox (all entity types)
├── Recent (all entity types)
├── My Library (topics, sources, practices with filters)
├── Archived (all entity types)
├── (space)
├── Logbook
```

**My Library Page**: Single unified page showing all three entity types with filter tabs or toggles to show/hide specific types.

---

## Phase 1: Foundation — FSRS Extraction + Topic Tree Conversion ✅ COMPLETED

**Completed:** 2026-01-20

### Overview

Extract FSRS state to a shared table and convert topics from DAG to tree hierarchy. This is the highest-risk phase requiring careful data migration with rollback capability.

### Changes Required

#### 1. Create `fsrs_states` Table

**File**: `supabase/migrations/YYYYMMDD000001_create_fsrs_states.sql`

```sql
-- Create fsrs_states table with inherited fields
CREATE TABLE fsrs_states (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stability REAL CHECK (stability > 0),
  difficulty REAL CHECK (difficulty >= 0 AND difficulty <= 10),
  state learning_state NOT NULL DEFAULT 'LEARNING',
  step INTEGER,
  last_reviewed_at DATE,
  srs_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Inherited fields (propagated from parent)
  inherited_stability REAL,
  inherited_difficulty REAL CHECK (inherited_difficulty >= 0 AND inherited_difficulty <= 10),
  inherited_state learning_state,
  inherited_step INTEGER,
  inherited_last_review DATE,
  -- Timestamps
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER update_fsrs_states_updated_at BEFORE UPDATE ON fsrs_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_fsrs_states_srs_enabled ON fsrs_states(srs_enabled) WHERE srs_enabled = true;

-- Cleanup orphaned fsrs_states when entities are deleted
-- Note: This function is created with topics-only check initially.
-- It will be updated via CREATE OR REPLACE in Phase 2 (add sources) and Phase 3 (add practices).
CREATE OR REPLACE FUNCTION cleanup_orphaned_fsrs_states()
RETURNS TRIGGER AS $$
BEGIN
  -- Phase 1: Only check topics table (sources and practices don't exist yet)
  DELETE FROM fsrs_states
  WHERE id = OLD.fsrs_state_id
    AND NOT EXISTS (SELECT 1 FROM topics WHERE fsrs_state_id = OLD.fsrs_state_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

**Rationale**: Shared FSRS state allows Topics, Sources, and Practices to all have reviewable state. The cleanup function prevents orphaned records when entities are deleted. It starts with topics-only and is extended in later phases.

#### 2. Add `parent_id`, `path`, and `fsrs_state_id` to Topics

**File**: `supabase/migrations/YYYYMMDD000002_add_topic_parent_fsrs.sql`

```sql
-- Enable ltree extension for materialized path hierarchy
CREATE EXTENSION IF NOT EXISTS ltree;

-- Add parent_id for tree structure
ALTER TABLE topics ADD COLUMN parent_id BIGINT REFERENCES topics(id) ON DELETE RESTRICT;

-- Add ltree path for O(1) ancestry checks (format: "root_id.parent_id.child_id")
ALTER TABLE topics ADD COLUMN path ltree;

-- Add fsrs_state_id for shared FSRS
ALTER TABLE topics ADD COLUMN fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL;

-- Index for hierarchy traversal
CREATE INDEX idx_topics_parent ON topics(parent_id);
CREATE INDEX idx_topics_path_gist ON topics USING GIST (path);
CREATE INDEX idx_topics_fsrs ON topics(fsrs_state_id);

-- Cleanup orphaned fsrs_states when topic is deleted
CREATE TRIGGER cleanup_fsrs_after_topic_delete
  AFTER DELETE ON topics
  FOR EACH ROW
  WHEN (OLD.fsrs_state_id IS NOT NULL)
  EXECUTE FUNCTION cleanup_orphaned_fsrs_states();

-- Function to compute path from parent
CREATE OR REPLACE FUNCTION compute_topic_path(topic_id BIGINT, topic_parent_id BIGINT)
RETURNS ltree AS $$
DECLARE
  parent_path ltree;
BEGIN
  IF topic_parent_id IS NULL THEN
    RETURN topic_id::text::ltree;
  END IF;

  SELECT path INTO parent_path FROM topics WHERE id = topic_parent_id;
  RETURN parent_path || topic_id::text::ltree;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain path on insert/update
CREATE OR REPLACE FUNCTION maintain_topic_path()
RETURNS TRIGGER AS $$
BEGIN
  NEW.path := compute_topic_path(NEW.id, NEW.parent_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_topic_path_insert
  BEFORE INSERT ON topics
  FOR EACH ROW EXECUTE FUNCTION maintain_topic_path();

CREATE TRIGGER trg_topic_path_update
  BEFORE UPDATE OF parent_id ON topics
  FOR EACH ROW
  WHEN (OLD.parent_id IS DISTINCT FROM NEW.parent_id)
  EXECUTE FUNCTION maintain_topic_path();

-- Function to update descendant paths when a topic moves
CREATE OR REPLACE FUNCTION update_descendant_paths()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all descendants' paths
  UPDATE topics
  SET path = NEW.path || subpath(path, nlevel(OLD.path))
  WHERE path <@ OLD.path AND id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_topic_descendant_paths
  AFTER UPDATE OF path ON topics
  FOR EACH ROW
  WHEN (OLD.path IS DISTINCT FROM NEW.path)
  EXECUTE FUNCTION update_descendant_paths();
```

**Rationale**: Using PostgreSQL's `ltree` extension provides O(1) ancestry checks via the `@>` (ancestor of) and `<@` (descendant of) operators. This is far more performant than iterative parent traversal for cycle detection and subtree queries.

#### 3. Migrate Data: FSRS State and Hierarchy

**File**: `supabase/migrations/YYYYMMDD000003_migrate_topic_data.sql`

```sql
-- Step 1: Create fsrs_states records and link to topics (row-by-row for correct 1:1 mapping)
DO $$
DECLARE
  t RECORD;
  new_fsrs_id BIGINT;
BEGIN
  FOR t IN
    SELECT id, stability, difficulty, state, step, last_reviewed_at, srs_enabled,
           inherited_stability, inherited_difficulty, inherited_state, inherited_step, inherited_last_review
    FROM topics
    WHERE srs_enabled = true OR stability IS NOT NULL
  LOOP
    INSERT INTO fsrs_states (
      stability, difficulty, state, step, last_reviewed_at, srs_enabled,
      inherited_stability, inherited_difficulty, inherited_state, inherited_step, inherited_last_review
    )
    VALUES (
      t.stability, t.difficulty, t.state::learning_state, t.step, t.last_reviewed_at, t.srs_enabled,
      t.inherited_stability, t.inherited_difficulty, t.inherited_state::learning_state, t.inherited_step, t.inherited_last_review
    )
    RETURNING id INTO new_fsrs_id;

    UPDATE topics SET fsrs_state_id = new_fsrs_id WHERE id = t.id;
  END LOOP;
END $$;

-- Step 2: Disable path triggers during migration
-- The path triggers would fire during parent_id updates, but parent paths don't exist yet.
-- We'll compute all paths in a single pass after setting parent_ids.
ALTER TABLE topics DISABLE TRIGGER trg_topic_path_update;
ALTER TABLE topics DISABLE TRIGGER trg_topic_descendant_paths;

-- Step 3: Migrate hierarchy - first parent becomes parent_id
WITH first_parents AS (
  SELECT DISTINCT ON (tc.descendant)
    tc.descendant AS topic_id,
    tc.ancestor AS parent_id
  FROM topics_closure tc
  WHERE tc.depth = 1
  ORDER BY tc.descendant, tc.inserted_at ASC
)
UPDATE topics t
SET parent_id = fp.parent_id
FROM first_parents fp
WHERE t.id = fp.topic_id;

-- Step 4: Move additional parents to related
INSERT INTO topic_other_relations (from_topic_id, to_topic_id)
SELECT tc.descendant, tc.ancestor
FROM topics_closure tc
WHERE tc.depth = 1
  AND NOT EXISTS (
    SELECT 1 FROM topics t WHERE t.id = tc.descendant AND t.parent_id = tc.ancestor
  )
ON CONFLICT DO NOTHING;

-- Step 5: Compute ltree paths for all topics (bottom-up traversal)
-- This is done with triggers disabled to avoid errors from missing parent paths
WITH RECURSIVE topic_paths AS (
  -- Base case: root topics (no parent)
  SELECT id, id::text::ltree AS path
  FROM topics
  WHERE parent_id IS NULL

  UNION ALL

  -- Recursive case: append child id to parent path
  SELECT t.id, tp.path || t.id::text::ltree
  FROM topics t
  JOIN topic_paths tp ON t.parent_id = tp.id
)
UPDATE topics t
SET path = tp.path
FROM topic_paths tp
WHERE t.id = tp.id;

-- Step 6: Re-enable path triggers
ALTER TABLE topics ENABLE TRIGGER trg_topic_path_update;
ALTER TABLE topics ENABLE TRIGGER trg_topic_descendant_paths;
```

**Rationale**: Automated migration picks first parent (by insertion order), moves rest to related. Triggers are disabled during migration because the `trg_topic_path_update` trigger would fire when `parent_id` is set, but at that point parent paths don't exist yet. After all parent_ids are set, we compute paths in a single recursive pass, then re-enable triggers for normal operation.

#### 4. Create `topic_reviews` Association Table

**File**: `supabase/migrations/YYYYMMDD000004_create_topic_reviews.sql`

This must be created first, before the trigger functions that reference it.

```sql
-- Create topic_reviews association table
CREATE TABLE topic_reviews (
  review_id BIGINT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE
);

-- Populate from existing reviews
INSERT INTO topic_reviews (review_id, topic_id)
SELECT id, topic_id FROM reviews WHERE topic_id IS NOT NULL;

-- Index for lookups
CREATE INDEX idx_topic_reviews_topic ON topic_reviews(topic_id);

-- Make reviews.topic_id nullable (association table now handles this)
ALTER TABLE reviews ALTER COLUMN topic_id DROP NOT NULL;

-- Cascade delete trigger: when topic_reviews row deleted, delete the review
CREATE OR REPLACE FUNCTION cascade_review_delete_on_topic_reviews()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM reviews WHERE id = OLD.review_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_review_delete_topic
  AFTER DELETE ON topic_reviews
  FOR EACH ROW EXECUTE FUNCTION cascade_review_delete_on_topic_reviews();
```

**Rationale**: Creating `topic_reviews` first allows the review trigger functions (in the next migration) to reference it. Existing reviews are migrated to the association table, and `reviews.topic_id` becomes nullable.

#### 4b. Update Review Trigger for New Structure

**File**: `supabase/migrations/YYYYMMDD000004b_review_triggers.sql`

The review trigger approach uses separate functions for each entity type, triggered from the association tables. This is cleaner than a polymorphic function that needs to check multiple tables.

```sql
-- Drop the old trigger on reviews table (it used topics.last_reviewed_at directly)
DROP TRIGGER IF EXISTS trg_update_topic_last_reviewed_at ON reviews;
DROP FUNCTION IF EXISTS update_topic_last_reviewed_at();

-- Generic function to update fsrs_state.last_reviewed_at for any entity
-- Called by entity-specific trigger functions
CREATE OR REPLACE FUNCTION update_last_reviewed(
  p_fsrs_state_id BIGINT,
  p_completed_at DATE
)
RETURNS VOID AS $$
BEGIN
  IF p_fsrs_state_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE fsrs_states
  SET last_reviewed_at = GREATEST(COALESCE(last_reviewed_at, p_completed_at), p_completed_at)
  WHERE id = p_fsrs_state_id;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate last_reviewed_at from all reviews for an entity
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

  -- Get max completed_at from the appropriate association table
  EXECUTE format(
    'SELECT MAX(r.completed_at) FROM reviews r JOIN %I_reviews er ON r.id = er.review_id WHERE er.%I_id = $1 AND r.completed_at IS NOT NULL',
    p_entity_type, p_entity_type
  ) INTO v_max_completed USING p_entity_id;

  UPDATE fsrs_states
  SET last_reviewed_at = v_max_completed
  WHERE id = p_fsrs_state_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for topic reviews (uses topic_reviews association)
CREATE OR REPLACE FUNCTION update_topic_last_reviewed()
RETURNS TRIGGER AS $$
DECLARE
  v_fsrs_state_id BIGINT;
  v_topic_id BIGINT;
  v_completed_at DATE;
BEGIN
  -- Get the topic_id from the association table
  IF TG_OP = 'DELETE' THEN
    v_topic_id := OLD.topic_id;
  ELSE
    v_topic_id := NEW.topic_id;
  END IF;

  -- Get fsrs_state_id from topic
  SELECT fsrs_state_id INTO v_fsrs_state_id FROM topics WHERE id = v_topic_id;

  IF v_fsrs_state_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get completed_at from the review
  IF TG_OP = 'DELETE' THEN
    SELECT completed_at INTO v_completed_at FROM reviews WHERE id = OLD.review_id;
  ELSE
    SELECT completed_at INTO v_completed_at FROM reviews WHERE id = NEW.review_id;
  END IF;

  IF TG_OP = 'INSERT' AND v_completed_at IS NOT NULL THEN
    PERFORM update_last_reviewed(v_fsrs_state_id, v_completed_at);
  ELSIF TG_OP = 'DELETE' AND v_completed_at IS NOT NULL THEN
    -- Recalculate from remaining reviews
    PERFORM recalc_last_reviewed(v_fsrs_state_id, 'topic', v_topic_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to topic_reviews (table created in previous migration)
CREATE TRIGGER trg_update_topic_last_reviewed
  AFTER INSERT OR DELETE ON topic_reviews
  FOR EACH ROW EXECUTE FUNCTION update_topic_last_reviewed();

-- Trigger on reviews table for completed_at changes (affects topic_reviews during Phase 1)
-- This handles updates to reviews.completed_at
CREATE OR REPLACE FUNCTION refresh_last_reviewed_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_fsrs_state_id BIGINT;
  v_topic_id BIGINT;
BEGIN
  -- Only act if completed_at changed
  IF NEW.completed_at IS NOT DISTINCT FROM OLD.completed_at THEN
    RETURN NEW;
  END IF;

  -- Check topic_reviews (Phase 1 uses this only)
  SELECT tr.topic_id, t.fsrs_state_id
  INTO v_topic_id, v_fsrs_state_id
  FROM topic_reviews tr
  JOIN topics t ON t.id = tr.topic_id
  WHERE tr.review_id = NEW.id;

  IF v_fsrs_state_id IS NOT NULL THEN
    IF NEW.completed_at IS NOT NULL THEN
      PERFORM update_last_reviewed(v_fsrs_state_id, NEW.completed_at);
    ELSE
      PERFORM recalc_last_reviewed(v_fsrs_state_id, 'topic', v_topic_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_last_reviewed_on_completion
  AFTER UPDATE OF completed_at ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_last_reviewed_on_completion();
```

**Note**: This trigger setup handles topic reviews during Phase 1. Phase 2 will extend `refresh_last_reviewed_on_completion()` to also check `source_reviews`, and Phase 3 will add `practice_reviews`.

#### 5. Drop Old Columns and Closure Table

**File**: `supabase/migrations/YYYYMMDD000005_cleanup_old_schema.sql`

```sql
-- Remove FSRS columns from topics (now in fsrs_states)
ALTER TABLE topics
  DROP COLUMN stability,
  DROP COLUMN difficulty,
  DROP COLUMN state,
  DROP COLUMN step,
  DROP COLUMN last_reviewed_at,
  DROP COLUMN srs_enabled,
  DROP COLUMN inherited_stability,
  DROP COLUMN inherited_difficulty,
  DROP COLUMN inherited_state,
  DROP COLUMN inherited_step,
  DROP COLUMN inherited_last_review;

-- Drop closure table functions
DROP FUNCTION IF EXISTS insert_relationship(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS delete_relationship(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS insert_topic_reflexive_path();
DROP FUNCTION IF EXISTS get_potential_parents(BIGINT, TEXT);
DROP FUNCTION IF EXISTS get_potential_children(BIGINT, TEXT);

-- Drop closure table and triggers
DROP TRIGGER IF EXISTS insert_topic_reflexive_path_closure ON topics;
DROP TRIGGER IF EXISTS update_topics_closure_updated_at ON topics_closure;
DROP TABLE IF EXISTS topics_closure;
```

#### 6. Update FsrsState Model

**File**: `apps/api/app/models/fsrs_state.py` (new)

```python
from sqlalchemy import BigInteger, Boolean, Date, Enum, Integer, REAL, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class FsrsState(Base):
    __tablename__ = "fsrs_states"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    stability: Mapped[float | None] = mapped_column(REAL)
    difficulty: Mapped[float | None] = mapped_column(REAL)
    state: Mapped[str] = mapped_column(
        Enum("LEARNING", "REVIEW", "RELEARNING", name="learning_state"),
        server_default="LEARNING"
    )
    step: Mapped[int | None] = mapped_column(Integer)
    last_reviewed_at: Mapped[date | None] = mapped_column(Date)
    srs_enabled: Mapped[bool] = mapped_column(Boolean, server_default="false")

    # Inherited fields
    inherited_stability: Mapped[float | None] = mapped_column(REAL)
    inherited_difficulty: Mapped[float | None] = mapped_column(REAL)
    inherited_state: Mapped[str | None] = mapped_column(
        Enum("LEARNING", "REVIEW", "RELEARNING", name="learning_state")
    )
    inherited_step: Mapped[int | None] = mapped_column(Integer)
    inherited_last_review: Mapped[date | None] = mapped_column(Date)

    inserted_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
```

#### 7. Update Topic Model

**File**: `apps/api/app/models/topics.py`

Remove FSRS fields and closure table relationships. Add `parent_id` and `fsrs_state_id`:

```python
class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(Text, server_default="")
    notes: Mapped[str] = mapped_column(Text, server_default="")

    # Tree hierarchy with ltree materialized path
    parent_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("topics.id"))
    path: Mapped[str | None] = mapped_column(Text)  # ltree stored as text, maintained by trigger

    # FSRS state (shared table)
    fsrs_state_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("fsrs_states.id"), unique=True
    )

    # Status flags
    archived: Mapped[bool] = mapped_column(Boolean, server_default="false")
    inboxed: Mapped[bool] = mapped_column(Boolean, server_default="false")

    # Timestamps
    inserted_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))

    # Relationships
    parent: Mapped["Topic | None"] = relationship(
        "Topic", remote_side=[id], back_populates="children"
    )
    children: Mapped[list["Topic"]] = relationship(
        "Topic", back_populates="parent"
    )
    fsrs_state: Mapped["FsrsState | None"] = relationship("FsrsState")
    # Note: reviews are accessed via topic_reviews association table, not direct FK
    # The direct reviews relationship is removed in Phase 3 when reviews.topic_id is dropped

    # Computed property for retrievability
    @hybrid_property
    def retrievability(self) -> float | None:
        if self.fsrs_state is None:
            return None
        return calculate_retrievability(
            self.fsrs_state.stability,
            self.fsrs_state.last_reviewed_at
        )
```

#### 8. Update Topic Schemas

**File**: `apps/api/app/schemas/topics.py`

```python
class TopicBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str = ""
    notes: str = ""
    archived: bool = False
    inboxed: bool = False

class TopicRead(TopicBase):
    id: int
    parent_id: int | None = None
    fsrs_state_id: int | None = None
    inserted_at: datetime
    updated_at: datetime
    # FSRS fields (from joined fsrs_state)
    stability: float | None = None
    difficulty: float | None = None
    state: LearningState | None = None
    step: int | None = None
    srs_enabled: bool = False
    last_reviewed_at: date | None = None
    # Inherited fields
    inherited_stability: float | None = None
    inherited_difficulty: float | None = None
    inherited_state: LearningState | None = None
    inherited_step: int | None = None
    inherited_last_review: date | None = None
    # Computed
    retrievability: float | None = None
    bucket: RetrievabilityBucket | None = None
    days_until_threshold: int | None = None

class TopicSummaryRead(TopicRead):
    children_count: int = 0
    related_outgoing_count: int = 0
    related_incoming_count: int = 0

class TopicDetailRead(TopicRead):
    parent: TopicSummaryRead | None = None
    children: list[TopicSummaryRead] = []
    related_outgoing: list[TopicSummaryRead] = []
    related_incoming: list[TopicSummaryRead] = []

class TopicCreate(TopicBase):
    parent_id: int | None = None
    srs_enabled: bool = False
    inherit_fsrs: bool = False  # If true and parent_id set, copy parent's FSRS state to inherited_* fields

# Note: When `inherit_fsrs=True` and `parent_id` is provided, the backend populates
# the `inherited_*` fields on the new topic's fsrs_state from the parent's current
# FSRS state. This happens once at creation time—inherited fields are NOT automatically
# updated when the parent's state changes later. The frontend AddTopicDialog presents
# this as an "Inherit scheduling from parent" checkbox.

class TopicUpdate(BaseModel):
    name: str | None = None
    notes: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    parent_id: int | None = None  # explicit null clears parent
    srs_enabled: bool | None = None
```

#### 9. Update Topic Router

**File**: `apps/api/app/routers/topics.py`

Key changes:
- Remove `/topics/{id}/parents/` endpoints (parent via PATCH)
- Replace closure table queries with simple `parent_id` joins
- Add cycle detection for parent assignment
- Update CRUD to handle `fsrs_state` lifecycle

```python
@router.patch("/topics/{topic_id}/", response_model=TopicSummaryRead)
async def update_topic(
    topic_id: int,
    payload: TopicUpdate,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    topic = await get_topic_or_404(session, topic_id, user_id)

    update_data = payload.model_dump(exclude_unset=True)

    # Handle parent_id change with cycle detection
    if "parent_id" in update_data:
        new_parent_id = update_data["parent_id"]
        if new_parent_id is not None:
            # Check for cycles using ltree: new parent cannot be a descendant of this topic
            if await is_descendant_of(session, new_parent_id, topic_id):
                raise HTTPException(409, "Cannot set parent: would create cycle")

    # Handle srs_enabled toggle
    if "srs_enabled" in update_data:
        if update_data["srs_enabled"] and topic.fsrs_state_id is None:
            # Create fsrs_state
            fsrs_state = FsrsState(srs_enabled=True)
            session.add(fsrs_state)
            await session.flush()
            topic.fsrs_state_id = fsrs_state.id
        elif not update_data["srs_enabled"] and topic.fsrs_state:
            topic.fsrs_state.srs_enabled = False
        del update_data["srs_enabled"]

    for key, value in update_data.items():
        setattr(topic, key, value)

    await session.commit()
    return await load_topic_summary(session, topic)

async def is_descendant_of(session: AsyncSession, potential_descendant_id: int, ancestor_id: int) -> bool:
    """
    Check if potential_descendant is a descendant of ancestor using ltree.
    Returns True if setting ancestor's parent to potential_descendant would create a cycle.

    Uses O(1) ltree operator: descendant.path <@ ancestor.path
    """
    result = await session.execute(
        text("""
            SELECT EXISTS (
                SELECT 1 FROM topics d, topics a
                WHERE d.id = :descendant_id
                  AND a.id = :ancestor_id
                  AND d.path <@ a.path
            )
        """),
        {"descendant_id": potential_descendant_id, "ancestor_id": ancestor_id}
    )
    return result.scalar()
```

**Note**: The `<@` operator checks if the left path is a descendant of (contained by) the right path. This is an O(1) operation with the GIST index, compared to O(d) iterative traversal where d is tree depth.

#### 9.1 Add Delete Endpoint with Child Handling

The API design requires explicit child handling when deleting topics with children. This must be implemented in Phase 1 since we're changing the hierarchy structure.

```python
from enum import Enum

class ChildHandlingStrategy(str, Enum):
    DELETE = "delete"
    ORPHAN = "orphan"
    REPARENT = "reparent"

@router.delete("/topics/{topic_id}/", status_code=204)
async def delete_topic(
    topic_id: int,
    handle_children_by: ChildHandlingStrategy | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    topic = await get_topic_or_404(session, topic_id, user_id)

    # Check if topic has children
    children_count = await session.scalar(
        select(func.count()).select_from(Topic).where(Topic.parent_id == topic_id)
    )

    if children_count > 0:
        if handle_children_by is None:
            raise HTTPException(
                status_code=409,
                detail=f"Topic has {children_count} children. Specify handle_children_by: delete, orphan, or reparent"
            )

        if handle_children_by == ChildHandlingStrategy.DELETE:
            # Recursively delete all descendants using ltree
            await session.execute(
                delete(Topic).where(Topic.path.op('<@')(topic.path))
            )
        elif handle_children_by == ChildHandlingStrategy.ORPHAN:
            # Set children's parent_id to null (make them root topics)
            await session.execute(
                update(Topic)
                .where(Topic.parent_id == topic_id)
                .values(parent_id=None)
            )
        elif handle_children_by == ChildHandlingStrategy.REPARENT:
            if topic.parent_id is None:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot reparent: topic has no parent (is a root topic)"
                )
            # Set children's parent_id to grandparent
            await session.execute(
                update(Topic)
                .where(Topic.parent_id == topic_id)
                .values(parent_id=topic.parent_id)
            )

    await session.delete(topic)
    await session.commit()
```

**Note**: The `ON DELETE RESTRICT` constraint on `parent_id` prevents cascade deletion at the database level, requiring application-level handling via this endpoint.

#### 10. Update Frontend Types

**File**: `apps/web/src/features/topics/types/topic.types.ts`

```typescript
export type Topic = {
  id: number
  name: string
  notes: string
  parent_id: number | null
  fsrs_state_id: number | null
  inserted_at: string
  updated_at: string
  // FSRS fields (from joined fsrs_state)
  stability: number | null
  difficulty: number | null
  state: LearningState | null
  step: number | null
  srs_enabled: boolean
  last_reviewed_at: string | null
  // Inherited fields
  inherited_stability: number | null
  inherited_difficulty: number | null
  inherited_state: LearningState | null
  inherited_step: number | null
  inherited_last_review: string | null
  // Computed
  retrievability: number | null
  bucket: RetrievabilityBucket | null
  days_until_threshold: number | null
  // Relationships (for detail views)
  parent?: Topic
  children?: Topic[]
  children_count?: number
  related_outgoing?: Topic[]
  related_incoming?: Topic[]
  related_outgoing_count?: number
  related_incoming_count?: number
}

export type RetrievabilityBucket = 'LATE' | 'ON_TIME' | 'EARLY'
```

#### 11. Update Frontend API

**File**: `apps/web/src/features/topics/api/updateTopic.ts`

Update to use PATCH and handle `parent_id`:

```typescript
export async function updateTopic(input: UpdateTopicInput): Promise<Topic> {
  const response = await apiFetch(
    `${import.meta.env.VITE_API_URL}/topics/${input.id}/`,
    {
      method: 'PATCH',  // Changed from POST
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    }
  )
  // ... validation
}
```

#### 12. Update TopicDetail Component

**File**: `apps/web/src/features/topics/components/TopicDetail/TopicDetail.tsx`

Remove parent management (now via PATCH), update to use new schema structure.

### Success Criteria

#### Automated Verification:
- [x] Command: `cd apps/api && uv run pytest tests/`
- [x] Command: `cd apps/web && pnpm test:ci`
- [x] Command: `cd apps/web && pnpm lint`
- [x] Command: `cd apps/web && pnpm build`

#### Manual Verification:
- [x] Topics display correctly with FSRS data from joined table
- [x] Parent/child relationships work via tree structure
- [x] Changing parent via topic detail updates correctly
- [x] SRS toggle creates/updates fsrs_state record
- [x] No data loss after migration

#### Claude in Chrome E2E Testing:
After automated verification passes, use Claude in Chrome to manually verify:
- [x] Create, read, update, delete topics
- [x] Parent/child management, cycle prevention
- [x] Delete with handle_children_by (delete/orphan/reparent strategies)
- [x] SRS toggle, retrievability display

**Implementation Note**: After automated verification, proceed directly to Claude in Chrome E2E testing. Pause for user review after E2E testing is complete before proceeding to Phase 2.

---

## Phase 2: Sources Entity

### Overview

Implement the complete Sources entity as a vertical slice: database, API, and frontend. Sources represent learning materials (books, chapters, articles) with recursive nesting.

### Changes Required

#### 1. Create Sources Tables

**File**: `supabase/migrations/YYYYMMDD000010_create_sources.sql`

```sql
-- Sources table with ltree path for hierarchy
CREATE TABLE sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  parent_id BIGINT REFERENCES sources(id) ON DELETE RESTRICT,
  path ltree,  -- Materialized path for O(1) ancestry checks
  fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  inboxed BOOLEAN NOT NULL DEFAULT false,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Source covers Topic junction
CREATE TABLE source_topics (
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (source_id, topic_id)
);

-- Indexes
CREATE INDEX idx_sources_parent ON sources(parent_id);
CREATE INDEX idx_sources_path_gist ON sources USING GIST (path);
CREATE INDEX idx_sources_user ON sources(user_id);
CREATE INDEX idx_sources_fsrs ON sources(fsrs_state_id);
CREATE INDEX idx_source_topics_topic ON source_topics(topic_id);

-- Update cleanup function to include sources (was topics-only in Phase 1)
CREATE OR REPLACE FUNCTION cleanup_orphaned_fsrs_states()
RETURNS TRIGGER AS $$
BEGIN
  -- Phase 2: Check both topics and sources tables
  DELETE FROM fsrs_states
  WHERE id = OLD.fsrs_state_id
    AND NOT EXISTS (SELECT 1 FROM topics WHERE fsrs_state_id = OLD.fsrs_state_id)
    AND NOT EXISTS (SELECT 1 FROM sources WHERE fsrs_state_id = OLD.fsrs_state_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Cleanup orphaned fsrs_states when source is deleted
CREATE TRIGGER cleanup_fsrs_after_source_delete
  AFTER DELETE ON sources
  FOR EACH ROW
  WHEN (OLD.fsrs_state_id IS NOT NULL)
  EXECUTE FUNCTION cleanup_orphaned_fsrs_states();

-- Function to compute path from parent (sources)
CREATE OR REPLACE FUNCTION compute_source_path(source_id BIGINT, source_parent_id BIGINT)
RETURNS ltree AS $$
DECLARE
  parent_path ltree;
BEGIN
  IF source_parent_id IS NULL THEN
    RETURN source_id::text::ltree;
  END IF;

  SELECT path INTO parent_path FROM sources WHERE id = source_parent_id;
  RETURN parent_path || source_id::text::ltree;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain path on insert/update (sources)
CREATE OR REPLACE FUNCTION maintain_source_path()
RETURNS TRIGGER AS $$
BEGIN
  NEW.path := compute_source_path(NEW.id, NEW.parent_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_source_path_insert
  BEFORE INSERT ON sources
  FOR EACH ROW EXECUTE FUNCTION maintain_source_path();

CREATE TRIGGER trg_source_path_update
  BEFORE UPDATE OF parent_id ON sources
  FOR EACH ROW
  WHEN (OLD.parent_id IS DISTINCT FROM NEW.parent_id)
  EXECUTE FUNCTION maintain_source_path();

-- Function to update descendant paths when a source moves
CREATE OR REPLACE FUNCTION update_source_descendant_paths()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sources
  SET path = NEW.path || subpath(path, nlevel(OLD.path))
  WHERE path <@ OLD.path AND id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_source_descendant_paths
  AFTER UPDATE OF path ON sources
  FOR EACH ROW
  WHEN (OLD.path IS DISTINCT FROM NEW.path)
  EXECUTE FUNCTION update_source_descendant_paths();

-- Triggers
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_source_topics_updated_at BEFORE UPDATE ON source_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2. Create Source Reviews Association

**File**: `supabase/migrations/YYYYMMDD000011_create_source_reviews.sql`

Note: `topic_reviews` was already created in Phase 1. This migration adds `source_reviews`.

```sql
-- Create source_reviews association table
CREATE TABLE source_reviews (
  review_id BIGINT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE
);

-- Cascade delete trigger for source_reviews
CREATE OR REPLACE FUNCTION cascade_review_delete_on_source_reviews()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM reviews WHERE id = OLD.review_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_review_delete_source
  AFTER DELETE ON source_reviews
  FOR EACH ROW EXECUTE FUNCTION cascade_review_delete_on_source_reviews();

-- Index for source_reviews (topic_reviews index was created in Phase 1)
CREATE INDEX idx_source_reviews_source ON source_reviews(source_id);

-- Trigger function for source reviews INSERT/DELETE (mirrors update_topic_last_reviewed)
CREATE OR REPLACE FUNCTION update_source_fsrs_on_review()
RETURNS TRIGGER AS $$
DECLARE
  v_fsrs_state_id BIGINT;
  v_source_id BIGINT;
  v_completed_at DATE;
BEGIN
  -- Get the source_id from the association table
  IF TG_OP = 'DELETE' THEN
    v_source_id := OLD.source_id;
  ELSE
    v_source_id := NEW.source_id;
  END IF;

  -- Get fsrs_state_id from source
  SELECT fsrs_state_id INTO v_fsrs_state_id FROM sources WHERE id = v_source_id;

  IF v_fsrs_state_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get completed_at from the review
  IF TG_OP = 'DELETE' THEN
    SELECT completed_at INTO v_completed_at FROM reviews WHERE id = OLD.review_id;
  ELSE
    SELECT completed_at INTO v_completed_at FROM reviews WHERE id = NEW.review_id;
  END IF;

  IF TG_OP = 'INSERT' AND v_completed_at IS NOT NULL THEN
    PERFORM update_last_reviewed(v_fsrs_state_id, v_completed_at);
  ELSIF TG_OP = 'DELETE' AND v_completed_at IS NOT NULL THEN
    -- Recalculate from remaining reviews
    PERFORM recalc_last_reviewed(v_fsrs_state_id, 'source', v_source_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to source_reviews for INSERT/DELETE
CREATE TRIGGER trg_source_reviews_fsrs
  AFTER INSERT OR DELETE ON source_reviews
  FOR EACH ROW EXECUTE FUNCTION update_source_fsrs_on_review();

-- Extend the review completion trigger to handle source_reviews (for UPDATE of completed_at)
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

  -- Check topic_reviews
  SELECT tr.topic_id, t.fsrs_state_id, 'topic'
  INTO v_entity_id, v_fsrs_state_id, v_entity_type
  FROM topic_reviews tr
  JOIN topics t ON t.id = tr.topic_id
  WHERE tr.review_id = NEW.id;

  -- If not found, check source_reviews
  IF v_fsrs_state_id IS NULL THEN
    SELECT sr.source_id, s.fsrs_state_id, 'source'
    INTO v_entity_id, v_fsrs_state_id, v_entity_type
    FROM source_reviews sr
    JOIN sources s ON s.id = sr.source_id
    WHERE sr.review_id = NEW.id;
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

#### 2b. Update Topic Model with `sources_count`

**File**: `apps/api/app/models/topics.py`

Now that `source_topics` table exists, add the `sources_count` column property to Topic:

```python
from app.models.source import t_source_topics  # Import the association table

class Topic(Base):
    # ... existing fields ...

    # Add this column_property (was commented out in Phase 1, now source_topics exists)
    sources_count: Mapped[int] = column_property(
        select(func.count())
        .select_from(t_source_topics)
        .where(t_source_topics.c.topic_id == id)
        .correlate_except(t_source_topics)
        .scalar_subquery()
    )
```

Also add the inverse relationship to Topic for sources that cover it:

```python
    # In Topic model relationships section:
    sources: Mapped[list["Source"]] = relationship(
        secondary="source_topics", back_populates="topics"
    )
```

#### 3. Create Source Model

**File**: `apps/api/app/models/source.py` (new)

```python
from sqlalchemy import BigInteger, Boolean, ForeignKey, String, Text, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(Text, server_default="")
    notes: Mapped[str] = mapped_column(Text, server_default="")
    parent_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("sources.id"))
    path: Mapped[str | None] = mapped_column(Text)  # ltree stored as text, maintained by trigger
    fsrs_state_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("fsrs_states.id"), unique=True
    )
    archived: Mapped[bool] = mapped_column(Boolean, server_default="false")
    inboxed: Mapped[bool] = mapped_column(Boolean, server_default="false")
    inserted_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))

    # Relationships
    parent: Mapped["Source | None"] = relationship(
        "Source", remote_side=[id], back_populates="children"
    )
    children: Mapped[list["Source"]] = relationship("Source", back_populates="parent")
    fsrs_state: Mapped["FsrsState | None"] = relationship("FsrsState")
    topics: Mapped[list["Topic"]] = relationship(
        secondary="source_topics", back_populates="sources"
    )

# Association table
t_source_topics = Table(
    "source_topics",
    Base.metadata,
    Column("source_id", BigInteger, ForeignKey("sources.id", ondelete="CASCADE"), primary_key=True),
    Column("topic_id", BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
)
```

#### 4. Create Source Schemas

**File**: `apps/api/app/schemas/source.py` (new)

```python
class SourceBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    title: str = ""
    notes: str = ""
    archived: bool = False
    inboxed: bool = False

class SourceRead(SourceBase):
    id: int
    parent_id: int | None = None
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
    bucket: RetrievabilityBucket | None = None
    days_until_threshold: int | None = None

class SourceSummaryRead(SourceRead):
    children_count: int = 0
    topics_count: int = 0
    related_outgoing_count: int = 0
    related_incoming_count: int = 0

class SourceDetailRead(SourceRead):
    parent: SourceSummaryRead | None = None
    children: list[SourceSummaryRead] = []
    topics: list[TopicSummaryRead] = []
    related_outgoing: list[RelatedItemRead] = []
    related_incoming: list[RelatedItemRead] = []

class SourceCreate(SourceBase):
    parent_id: int | None = None
    srs_enabled: bool = False
    inherit_fsrs: bool = False  # If true and parent_id set, copy parent's FSRS state to inherited_* fields

# Note: Same behavior as TopicCreate—inherited fields are set once at creation time
# from the parent's current FSRS state when `inherit_fsrs=True`.

class SourceUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    parent_id: int | None = None
    srs_enabled: bool | None = None

class SourceTopicAdd(BaseModel):
    topic_id: int

class SourceChildAdd(BaseModel):
    child_id: int
```

#### 5. Create Source Router

**File**: `apps/api/app/routers/sources.py` (new)

Full CRUD + relationship endpoints following the pattern from `topics.py`:
- `GET /sources` - List with filters
- `POST /sources` - Create
- `GET /sources/{id}` - Detail with relationships
- `PATCH /sources/{id}` - Update
- `DELETE /sources/{id}` - Delete with child handling
- `POST /sources/{id}/children` - Add child
- `DELETE /sources/{id}/children/{child_id}` - Remove child
- `POST /sources/{id}/topics` - Add covered topic
- `DELETE /sources/{id}/topics/{topic_id}` - Remove covered topic

#### 6. Update Reviews for Polymorphism

**File**: `apps/api/app/routers/reviews.py`

Add `POST /reviews/source` endpoint:

```python
@router.post("/reviews/source", response_model=ReviewRead)
async def create_source_review(
    payload: SourceReviewCreate,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    source = await get_source_or_404(session, payload.source_id, user_id)

    review = Review(
        user_id=user_id,
        scheduled_at=payload.scheduled_at,
        completed_at=payload.completed_at,
        rating=payload.rating,
    )
    session.add(review)
    await session.flush()

    # Create association
    await session.execute(
        insert(source_reviews).values(review_id=review.id, source_id=source.id)
    )
    await session.commit()

    return await load_review(session, review.id)
```

#### 7. Create Frontend Source Feature

**Directory**: `apps/web/src/features/sources/` (new)

Mirror the topics feature structure:
- `types/source.types.ts` - TypeScript types
- `types/source.schemas.ts` - Valibot schemas
- `types/api.types.ts` - API input types
- `api/queryKeys.ts` - Query key factory
- `api/getSources.ts` - List query
- `api/getSource.ts` - Detail query
- `api/createSource.ts` - Create mutation
- `api/updateSource.ts` - Update mutation
- `api/deleteSource.ts` - Delete mutation
- `components/SourceCard.tsx` - Card display
- `components/SourceDetail/` - Detail view
- `hooks/useSourcesList.tsx` - List rendering helpers

#### 8. Create Source Pages

**Files**:
- `apps/web/src/app/routes/_main/sources.tsx` - Redirect to home
- `apps/web/src/app/routes/_main/sources_.$sourceId.tsx` - Source detail route
- `apps/web/src/app/pages/SourceDetailPage.tsx` - Source detail page, modeled after the TopicDetailPage

#### 9. Update Create Button

**File**: `apps/web/src/app/components/AppSidebar/CreateButton.tsx`

Add "New source" option to the dropdown:

```typescript
// Add to dropdown menu items
<DropdownMenuItem onClick={() => setAddSourceDialogOpen(true)}>
  <BookOpen className="mr-2 h-4 w-4" />
  New source
</DropdownMenuItem>
```

**Note**: Sources will be accessible via the consolidated "My Library" page (implemented in Phase 3) rather than a separate "My Sources" page.

### Success Criteria

#### Automated Verification:
- [ ] Command: `cd apps/api && uv run pytest tests/`
- [ ] Command: `cd apps/web && pnpm test:ci`
- [ ] Command: `cd apps/web && pnpm lint`
- [ ] Command: `cd apps/web && pnpm build`

#### Manual Verification:
- [ ] Sources list page displays correctly
- [ ] Source detail page shows all relationships
- [ ] Creating source with parent works
- [ ] Adding topics to sources works
- [ ] Source reviews can be created and completed
- [ ] FSRS state updates on review completion

#### Claude in Chrome E2E Testing:
After automated verification passes, use Claude in Chrome to manually verify:
- [ ] Create, read, update, delete sources
- [ ] Parent/child sources
- [ ] Source covers topics
- [ ] Source review workflow

**Implementation Note**: After automated verification, proceed directly to Claude in Chrome E2E testing. Pause for user review after E2E testing is complete before proceeding to Phase 3.

---

## Phase 3: Practices Entity

### Overview

Implement the complete Practices entity. Practices represent exercises, problems, and drills with prompt/answer fields. Unlike Topics and Sources, Practices have no hierarchy.

### Changes Required

#### 1. Create Practices Tables

**File**: `supabase/migrations/YYYYMMDD000020_create_practices.sql`

```sql
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

-- Practice reviews
CREATE TABLE practice_reviews (
  review_id BIGINT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_practices_user ON practices(user_id);
CREATE INDEX idx_practices_fsrs ON practices(fsrs_state_id);
CREATE INDEX idx_practice_topics_topic ON practice_topics(topic_id);
CREATE INDEX idx_practice_sources_source ON practice_sources(source_id);
CREATE INDEX idx_practice_reviews_practice ON practice_reviews(practice_id);

-- Update cleanup function to include practices (final version with all three entity types)
CREATE OR REPLACE FUNCTION cleanup_orphaned_fsrs_states()
RETURNS TRIGGER AS $$
BEGIN
  -- Phase 3: Check all three entity tables (final version)
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

-- Cascade review deletion function (must be created BEFORE the trigger that references it)
CREATE OR REPLACE FUNCTION cascade_review_delete_on_practice_reviews()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM reviews WHERE id = OLD.review_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Cascade review deletion trigger (same pattern as source_reviews)
CREATE TRIGGER cascade_review_delete_practice
  AFTER DELETE ON practice_reviews
  FOR EACH ROW EXECUTE FUNCTION cascade_review_delete_on_practice_reviews();

-- Trigger function for practice reviews INSERT/DELETE (mirrors update_topic_last_reviewed and update_source_fsrs_on_review)
CREATE OR REPLACE FUNCTION update_practice_fsrs_on_review()
RETURNS TRIGGER AS $$
DECLARE
  v_fsrs_state_id BIGINT;
  v_practice_id BIGINT;
  v_completed_at DATE;
BEGIN
  -- Get the practice_id from the association table
  IF TG_OP = 'DELETE' THEN
    v_practice_id := OLD.practice_id;
  ELSE
    v_practice_id := NEW.practice_id;
  END IF;

  -- Get fsrs_state_id from practice
  SELECT fsrs_state_id INTO v_fsrs_state_id FROM practices WHERE id = v_practice_id;

  IF v_fsrs_state_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get completed_at from the review
  IF TG_OP = 'DELETE' THEN
    SELECT completed_at INTO v_completed_at FROM reviews WHERE id = OLD.review_id;
  ELSE
    SELECT completed_at INTO v_completed_at FROM reviews WHERE id = NEW.review_id;
  END IF;

  IF TG_OP = 'INSERT' AND v_completed_at IS NOT NULL THEN
    PERFORM update_last_reviewed(v_fsrs_state_id, v_completed_at);
  ELSIF TG_OP = 'DELETE' AND v_completed_at IS NOT NULL THEN
    -- Recalculate from remaining reviews
    PERFORM recalc_last_reviewed(v_fsrs_state_id, 'practice', v_practice_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to practice_reviews for INSERT/DELETE
CREATE TRIGGER trg_practice_reviews_fsrs
  AFTER INSERT OR DELETE ON practice_reviews
  FOR EACH ROW EXECUTE FUNCTION update_practice_fsrs_on_review();

-- Final extension of review completion trigger to handle all three entity types (for UPDATE of completed_at)
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

  -- Check topic_reviews
  SELECT tr.topic_id, t.fsrs_state_id, 'topic'
  INTO v_entity_id, v_fsrs_state_id, v_entity_type
  FROM topic_reviews tr
  JOIN topics t ON t.id = tr.topic_id
  WHERE tr.review_id = NEW.id;

  -- If not found, check source_reviews
  IF v_fsrs_state_id IS NULL THEN
    SELECT sr.source_id, s.fsrs_state_id, 'source'
    INTO v_entity_id, v_fsrs_state_id, v_entity_type
    FROM source_reviews sr
    JOIN sources s ON s.id = sr.source_id
    WHERE sr.review_id = NEW.id;
  END IF;

  -- If not found, check practice_reviews
  IF v_fsrs_state_id IS NULL THEN
    SELECT pr.practice_id, p.fsrs_state_id, 'practice'
    INTO v_entity_id, v_fsrs_state_id, v_entity_type
    FROM practice_reviews pr
    JOIN practices p ON p.id = pr.practice_id
    WHERE pr.review_id = NEW.id;
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

#### 1.5. Drop Legacy reviews.topic_id Column

**File**: `supabase/migrations/YYYYMMDD000022_drop_reviews_topic_id.sql`

Now that all reviews are associated via the polymorphic association tables (`topic_reviews`, `source_reviews`, `practice_reviews`), the legacy `reviews.topic_id` column is no longer needed.

```sql
-- Verify all existing reviews have been migrated to topic_reviews
DO $$
DECLARE
  unmigrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmigrated_count
  FROM reviews r
  WHERE r.topic_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM topic_reviews tr WHERE tr.review_id = r.id);

  IF unmigrated_count > 0 THEN
    RAISE EXCEPTION 'Cannot drop topic_id: % reviews have not been migrated to topic_reviews', unmigrated_count;
  END IF;
END $$;

-- Drop the legacy column
ALTER TABLE reviews DROP COLUMN topic_id;
```

**Rationale**: The `topic_id` column was kept nullable during Phases 1-2 to support the migration. With all three entity types now using association tables, the column is redundant and can be safely removed.

#### 1.6. Update Review SQLAlchemy Model

**File**: `apps/api/app/models/reviews.py`

Remove the `topic_id` column and relationship from the Review model now that it's been dropped from the database:

```python
# REMOVE these lines from the Review model:
# topic_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("topics.id"))
# topic: Mapped["Topic"] = relationship(back_populates="reviews")

# The Review model should now only have:
class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    review_session_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("review_sessions.id")
    )

    scheduled_at: Mapped[date | None] = mapped_column(Date)
    completed_at: Mapped[date | None] = mapped_column(Date)
    rating: Mapped[str | None] = mapped_column(
        Enum("MISS", "HARD", "GOOD", "EASY", name="rating")
    )
    description: Mapped[str] = mapped_column(Text, server_default="")
    notes: Mapped[str] = mapped_column(Text, server_default="")

    # FSRS snapshots (before/after) - unchanged
    stability_before: Mapped[float | None] = mapped_column(REAL)
    # ... rest of FSRS snapshot fields ...

    # Relationships - topic relationship REMOVED, session remains
    session: Mapped["ReviewSession | None"] = relationship(back_populates="reviews")

    inserted_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
```

**Also update** the Topic model to remove the inverse relationship:

```python
# In apps/api/app/models/topics.py, REMOVE:
# reviews: Mapped[list["Review"]] = relationship(back_populates="topic")
```

**Note**: Reviews are now accessed via the association tables (`topic_reviews`, `source_reviews`, `practice_reviews`). Use joins or secondary relationships to load reviews for an entity.

#### 1.7. Update Topic and Source Models with `practices_count`

**File**: `apps/api/app/models/topics.py`

Now that `practice_topics` table exists, add the `practices_count` column property to Topic:

```python
from app.models.practice import t_practice_topics  # Import the association table

class Topic(Base):
    # ... existing fields ...

    # Add this column_property (was commented out in Phase 1, now practice_topics exists)
    practices_count: Mapped[int] = column_property(
        select(func.count())
        .select_from(t_practice_topics)
        .where(t_practice_topics.c.topic_id == id)
        .correlate_except(t_practice_topics)
        .scalar_subquery()
    )

    # Also add the inverse relationship:
    practices: Mapped[list["Practice"]] = relationship(
        secondary="practice_topics", back_populates="topics"
    )
```

**File**: `apps/api/app/models/source.py`

Similarly, add `practices_count` to Source:

```python
from app.models.practice import t_practice_sources  # Import the association table

class Source(Base):
    # ... existing fields ...

    practices_count: Mapped[int] = column_property(
        select(func.count())
        .select_from(t_practice_sources)
        .where(t_practice_sources.c.source_id == id)
        .correlate_except(t_practice_sources)
        .scalar_subquery()
    )

    # Also add the inverse relationship:
    practices: Mapped[list["Practice"]] = relationship(
        secondary="practice_sources", back_populates="sources"
    )
```

#### 2. Create Practice Model, Schemas, Router

Following the same patterns as Sources (see Phase 2).

**Key differences:**
- No `parent_id` (practices don't nest)
- Fields are `prompt` and `answer` instead of `title` and `notes`
- Links to both Topics AND Sources via junction tables

#### 3. Create Frontend Practice Feature

**Directory**: `apps/web/src/features/practices/` (new)

Same structure as sources feature.

#### 4. Create Practice Pages

- `/my-practices` - List page
- `/practices/$practiceId` - Detail page

#### 5. Update Create Button

**File**: `apps/web/src/app/components/AppSidebar/CreateButton.tsx`

Add "New practice" option to complete the dropdown:

```typescript
// Final dropdown structure
<DropdownMenuItem onClick={() => setAddTopicDialogOpen(true)}>
  <Lightbulb className="mr-2 h-4 w-4" />
  New topic
</DropdownMenuItem>
<DropdownMenuItem onClick={() => setAddSourceDialogOpen(true)}>
  <BookOpen className="mr-2 h-4 w-4" />
  New source
</DropdownMenuItem>
<DropdownMenuItem onClick={() => setAddPracticeDialogOpen(true)}>
  <Dumbbell className="mr-2 h-4 w-4" />
  New practice
</DropdownMenuItem>
```

#### 6. Update Inbox Page for All Entity Types

**File**: `apps/web/src/app/pages/InboxPage.tsx`

Modify to fetch and display all three entity types:

```typescript
export function InboxPage() {
  const { data: topics } = useTopics({ inboxed: true, archived: false })
  const { data: sources } = useSources({ inboxed: true, archived: false })
  const { data: practices } = usePractices({ inboxed: true, archived: false })

  // Combine and sort by updated_at
  const inboxItems = useMemo(() => {
    const items: InboxItem[] = [
      ...(topics ?? []).map(t => ({ type: 'topic' as const, item: t })),
      ...(sources ?? []).map(s => ({ type: 'source' as const, item: s })),
      ...(practices ?? []).map(p => ({ type: 'practice' as const, item: p })),
    ]
    return items.sort((a, b) =>
      new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime()
    )
  }, [topics, sources, practices])

  // Render with EntityCard that handles all types
  return (
    <PageLayout>
      <PageLayout.Header icon={Inbox} title="Inbox" />
      <MasonryLayout
        items={inboxItems}
        renderItem={(item) => <EntityCard entity={item} />}
        // ...
      />
    </PageLayout>
  )
}
```

#### 7. Update Archived Page for All Entity Types

**File**: `apps/web/src/app/pages/ArchivedPage.tsx`

Same pattern as Inbox - fetch all three types, combine, and display:

```typescript
export function ArchivedPage() {
  const { data: topics } = useTopics({ archived: true })
  const { data: sources } = useSources({ archived: true })
  const { data: practices } = usePractices({ archived: true })

  // Combine and render same as InboxPage
}
```

#### 8. Update Recent Section on Home Page

**File**: `apps/web/src/app/pages/HomePage.tsx`

Rename "Recent Topics" to "Recent" and show all entity types:

```typescript
export function RecentSection() {
  const { data: topics } = useTopics({ order: 'desc', limit: RECENT_LIMIT })
  const { data: sources } = useSources({ order: 'desc', limit: RECENT_LIMIT })
  const { data: practices } = usePractices({ order: 'desc', limit: RECENT_LIMIT })

  // Combine and sort by updated_at
  const recentItems = useMemo(() => {
    const items: EntityItem[] = [
      ...(topics ?? []).map(t => ({ type: 'topic' as const, item: t })),
      ...(sources ?? []).map(s => ({ type: 'source' as const, item: s })),
      ...(practices ?? []).map(p => ({ type: 'practice' as const, item: p })),
    ]
    return items
      .sort((a, b) => new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime())
      .slice(0, RECENT_LIMIT)
  }, [topics, sources, practices])

  return (
    <Section title="Recent">
      {/* Render recentItems with EntityCard */}
    </Section>
  )
}
```

#### 9. Create Shared EntityCard Component

**File**: `apps/web/src/components/EntityCard.tsx` (new)

A unified card component that renders the appropriate card based on entity type:

```typescript
type EntityItem =
  | { type: 'topic'; item: Topic }
  | { type: 'source'; item: Source }
  | { type: 'practice'; item: Practice }

export function EntityCard({ entity }: { entity: EntityItem }) {
  switch (entity.type) {
    case 'topic':
      return <TopicCard topic={entity.item} />
    case 'source':
      return <SourceCard source={entity.item} />
    case 'practice':
      return <PracticeCard practice={entity.item} />
  }
}
```

#### 10. Create My Library Page (Consolidated)

**File**: `apps/web/src/app/pages/MyLibraryPage.tsx` (new)

Replace separate My Topics/My Sources/My Practices pages with a single unified library page:

```typescript
export function MyLibraryPage() {
  const [activeFilters, setActiveFilters] = useState<EntityType[]>(['topic', 'source', 'practice'])

  const { data: topics } = useTopics({ archived: false, inboxed: false })
  const { data: sources } = useSources({ archived: false, inboxed: false })
  const { data: practices } = usePractices({ archived: false, inboxed: false })

  const libraryItems = useMemo(() => {
    const items: EntityItem[] = []
    if (activeFilters.includes('topic')) {
      items.push(...(topics ?? []).map(t => ({ type: 'topic' as const, item: t })))
    }
    if (activeFilters.includes('source')) {
      items.push(...(sources ?? []).map(s => ({ type: 'source' as const, item: s })))
    }
    if (activeFilters.includes('practice')) {
      items.push(...(practices ?? []).map(p => ({ type: 'practice' as const, item: p })))
    }
    return items.sort((a, b) =>
      new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime()
    )
  }, [topics, sources, practices, activeFilters])

  return (
    <PageLayout>
      <PageLayout.Header icon={Library} title="My Library">
        <EntityTypeFilter
          active={activeFilters}
          onChange={setActiveFilters}
        />
      </PageLayout.Header>
      <MasonryLayout
        items={libraryItems}
        renderItem={(item) => <EntityCard entity={item} />}
      />
    </PageLayout>
  )
}
```

**File**: `apps/web/src/app/routes/_main/my-library.tsx` (new)

Route for My Library page.

#### 11. Add Recent Page to Sidebar

**File**: `apps/web/src/app/pages/RecentPage.tsx` (new)

Standalone page for "Recent" sidebar item showing all recently updated entities:

```typescript
export function RecentPage() {
  const { data: topics } = useTopics({ order: 'desc', limit: 50 })
  const { data: sources } = useSources({ order: 'desc', limit: 50 })
  const { data: practices } = usePractices({ order: 'desc', limit: 50 })

  const recentItems = useMemo(() => {
    const items: EntityItem[] = [
      ...(topics ?? []).map(t => ({ type: 'topic' as const, item: t })),
      ...(sources ?? []).map(s => ({ type: 'source' as const, item: s })),
      ...(practices ?? []).map(p => ({ type: 'practice' as const, item: p })),
    ]
    return items
      .sort((a, b) => new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime())
      .slice(0, 50)
  }, [topics, sources, practices])

  return (
    <PageLayout>
      <PageLayout.Header icon={Clock} title="Recent" />
      <MasonryLayout
        items={recentItems}
        renderItem={(item) => <EntityCard entity={item} />}
      />
    </PageLayout>
  )
}
```

#### 12. Update Sidebar Navigation

**File**: `apps/web/src/app/components/AppSidebar/AppSidebar.tsx`

Update sidebar to reflect new structure:

```typescript
// Replace My Topics, My Sources, My Practices with:
{
  title: 'Recent',
  url: '/recent',
  icon: Clock,
  isActive: (pathname) => pathname === '/recent'
},
{
  title: 'My Library',
  url: '/my-library',
  icon: Library,
  isActive: (pathname) => pathname.startsWith('/my-library')
}
```

### Success Criteria

#### Automated Verification:
- [ ] Command: `cd apps/api && uv run pytest tests/`
- [ ] Command: `cd apps/web && pnpm test:ci`
- [ ] Command: `cd apps/web && pnpm lint`
- [ ] Command: `cd apps/web && pnpm build`

#### Manual Verification:
- [ ] Practices list page works
- [ ] Practice detail shows prompt/answer
- [ ] Linking practices to topics works
- [ ] Linking practices to sources works
- [ ] Practice reviews work
- [ ] Create button shows all three entity types (topic, source, practice)
- [ ] Inbox page shows topics, sources, and practices together
- [ ] Archived page shows topics, sources, and practices together
- [ ] Home page "Recent" section shows all entity types
- [ ] Recent sidebar page shows all entity types
- [ ] My Library page shows all entity types with filter toggles

#### Claude in Chrome E2E Testing:
After automated verification passes, use Claude in Chrome to manually verify:
- [ ] Practice CRUD operations
- [ ] Practice links to topics
- [ ] Practice links to sources
- [ ] Practice review workflow
- [ ] Inbox shows all entity types
- [ ] Archived shows all entity types
- [ ] Create button works for all types
- [ ] Recent page shows all entity types
- [ ] My Library page with filters

---

## Phase 4: Entity Relations & Prerequisites

### Overview

Implement the unified `entity_relations` table (replacing `topic_other_relations`) and `source_prerequisites` for prerequisite tracking.

### Changes Required

#### 1. Create Entity Relations Table

**File**: `supabase/migrations/YYYYMMDD000030_create_entity_relations.sql`

```sql
CREATE TABLE entity_relations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  from_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  to_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  to_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT exactly_one_from CHECK (num_nonnulls(from_topic_id, from_source_id) = 1),
  CONSTRAINT exactly_one_to CHECK (num_nonnulls(to_topic_id, to_source_id) = 1),
  CONSTRAINT no_self_relation CHECK (
    from_topic_id IS DISTINCT FROM to_topic_id
    AND from_source_id IS DISTINCT FROM to_source_id
  ),
  CONSTRAINT unique_relation UNIQUE NULLS NOT DISTINCT (from_topic_id, from_source_id, to_topic_id, to_source_id)
);

-- Migrate existing relations
INSERT INTO entity_relations (from_topic_id, to_topic_id)
SELECT from_topic_id, to_topic_id FROM topic_other_relations;

-- Drop old table
DROP TABLE topic_other_relations;
```

#### 2. Create Source Prerequisites Table

**File**: `supabase/migrations/YYYYMMDD000031_create_source_prerequisites.sql`

```sql
CREATE TABLE source_prerequisites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  prereq_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  prereq_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT exactly_one_prereq CHECK (num_nonnulls(prereq_topic_id, prereq_source_id) = 1),
  CONSTRAINT no_self_prereq CHECK (source_id IS DISTINCT FROM prereq_source_id),
  CONSTRAINT unique_prereq UNIQUE NULLS NOT DISTINCT (source_id, prereq_topic_id, prereq_source_id)
);
```

#### 3. Update Models and Routers

Update Topic and Source models to use `entity_relations`. Add prerequisite relationships to Source.

#### 4. Add Related Endpoints for Sources

```
POST /sources/{id}/related
DELETE /sources/{id}/related/{entity_type}/{entity_id}
POST /sources/{id}/prerequisites
DELETE /sources/{id}/prerequisites/{entity_type}/{entity_id}
```

#### 5. Update Frontend

- Related panel now shows both topics and sources
- Add prerequisites UI to Source detail page
- Update discriminated union types for `RelatedItemRead`

### Success Criteria

#### Automated Verification:
- [ ] All tests pass
- [ ] Build succeeds

#### Manual Verification:
- [ ] Topic → Topic relations work
- [ ] Topic → Source relations work
- [ ] Source → Topic relations work
- [ ] Source → Source relations work
- [ ] Source prerequisites (topic) work
- [ ] Source prerequisites (source) work

#### Claude in Chrome E2E Testing:
After automated verification passes, use Claude in Chrome to manually verify:
- [ ] Topic relations (topic ↔ topic, topic ↔ source)
- [ ] Source relations (source ↔ topic, source ↔ source)
- [ ] Source prerequisites functionality

---

## Phase 5: Review Consolidation & Polish

### Overview

Consolidate the review experience and implement unified search across all entity types.

### Changes Required

#### 1. Unified Search Endpoint

**File**: `apps/api/app/routers/search.py` (new)

```python
@router.get("/search", response_model=SearchResponse)
async def search(
    q: str,
    types: list[str] = Query(default=["topic", "source", "practice"]),
    archived: bool = False,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    results = SearchResponse(topics=[], sources=[], practices=[], total_count=0)

    if "topic" in types:
        results.topics = await search_topics(session, user_id, q, archived, limit)
    if "source" in types:
        results.sources = await search_sources(session, user_id, q, archived, limit)
    if "practice" in types:
        results.practices = await search_practices(session, user_id, q, archived, limit)

    results.total_count = len(results.topics) + len(results.sources) + len(results.practices)
    return results
```

#### 2. Review Page Consolidation

Implement the design from `topic-review-consolidation.md`:
- Embedded Schedule card with Today/Upcoming/Unscheduled tabs
- Late/Ready/Early buckets for all entity types
- Remove separate Today/Upcoming/Unscheduled from sidebar

#### 3. Server-side Bucket Computation

Ensure all entity responses include computed `bucket` and `days_until_threshold` fields.

#### 4. Delete Confirmation UI

Implement frontend UI for explicit child handling selection on delete:
- Modal asking user to choose: delete children, orphan, or reparent
- Wire up to the `handle_children_by` query param (API implemented in Phase 1)

**Note**: The backend `handle_children_by` enforcement is already implemented in Phase 1 (section 9.1). This phase adds the frontend modal that prompts users to choose a strategy.

### Success Criteria

#### Automated Verification:
- [ ] All tests pass
- [ ] Build succeeds

#### Manual Verification:
- [ ] Unified search returns topics, sources, and practices
- [ ] Review page consolidation works as designed
- [ ] Delete confirmation shows child options
- [ ] All entity types show in appropriate buckets

#### Claude in Chrome E2E Testing:
After automated verification passes, use Claude in Chrome to manually verify:
- [ ] Unified search across all entity types
- [ ] Review page consolidation works as designed
- [ ] Delete confirmation modal for child handling selection

---

## Testing Strategy

### Database Migration Testing

When implementing database changes for each phase:

1. **Apply migrations locally:**
   ```bash
   cd supabase
   supabase migration up
   ```

2. **Verify schema changes:**
   ```bash
   # Check migration was applied
   supabase db diff

   # Inspect specific tables if needed
   supabase db dump --schema public --table <table_name>
   ```

3. **Run Claude in Chrome E2E testing:**
   ```bash
   # Start the API server (if not running)
   cd apps/api && fastapi dev app/main.py

   # Start the web dev server (if not running)
   cd apps/web && pnpm dev
   ```
   Then use Claude in Chrome to manually verify the full stack works correctly.

4. **Rollback if needed:**
   ```bash
   cd supabase
   supabase migration down
   ```

**Important**: Always test migrations against a local database first. Claude in Chrome E2E testing serves as integration verification to ensure the full stack (migrations → API → frontend) works correctly before proceeding to the next phase.

### Commit Strategy

Commit changes incrementally as you complete each logical unit of work:

1. **Database migrations**: Commit each migration file after verifying it applies cleanly
2. **Backend changes**: Commit models, schemas, and routers together when they form a working unit
3. **Frontend changes**: Commit API layer, components, and pages as cohesive features

**Example commit sequence for a phase:**
```
feat(api): add fsrs_states table migration
feat(api): add FsrsState model and update Topic model
feat(api): update topic router for new FSRS structure
feat(web): update topic types and API layer for FSRS changes
feat(web): update TopicDetail component for new schema
```

Frequent commits provide rollback points and make code review easier. Don't wait until an entire phase is complete to commit.

### Claude in Chrome E2E Testing

E2E testing is performed by Claude in Chrome after each phase's automated verification passes. Claude should proceed directly to E2E testing without pausing, then pause for user review after E2E testing is complete.

#### When to Run E2E Testing

After completing a phase and passing all automated checks (pytest, pnpm test:ci, pnpm lint, pnpm build):
1. Ensure the API server is running: `cd apps/api && fastapi dev app/main.py`
2. Ensure the web dev server is running: `cd apps/web && pnpm dev`
3. Claude proceeds directly with E2E testing (no pause needed)
4. After E2E testing is complete, pause for user review before proceeding to the next phase

#### What to Verify

For each phase, Claude in Chrome should verify:
- **CRUD operations**: Create, read, update, delete entities
- **Relationships**: Parent/child, related entities, junction table associations
- **Edge cases**: Cycle prevention, constraint violations, error handling
- **UI/UX**: Correct display of data, navigation, form interactions

#### Verification Approach

1. **Start fresh**: Reset the database with `supabase db reset` to get clean seed data
2. **Walk through user flows**: Create new entities, modify them, verify changes persist
3. **Test error cases**: Try invalid operations (cycles, missing required fields) and verify proper error messages
4. **Cross-check**: Verify that changes made in UI appear correctly when refreshing or navigating away and back

### API Tests

Each router gets corresponding pytest tests:
- CRUD operations
- Relationship management
- Error cases (404, 409 for conflicts)
- Authorization (403 for wrong user)

---

## Performance Considerations

1. **Eager loading**: Use SQLAlchemy `selectinload` for relationship counts to avoid N+1 queries
2. **Indexes**: All foreign keys and commonly filtered columns have indexes
3. **Pagination**: All list endpoints support `limit`/`offset`
4. **Computed fields**: `bucket` and `days_until_threshold` computed server-side to reduce frontend complexity
5. **ltree materialized paths**: O(1) ancestry/descendant checks via GIST-indexed `path` column
   - Cycle detection: `d.path <@ a.path` checks if d is descendant of a
   - Subtree queries: `WHERE path <@ '1.5.12'` finds all descendants
   - Ancestor queries: `WHERE '1.5.12.47' <@ path` finds all ancestors
   - Path maintenance: Triggers automatically update paths on parent changes

---

## Migration Notes

### Rollback Plan

Each migration phase should have a corresponding rollback migration that can restore the previous state:
- Phase 1: Restore FSRS columns to topics, recreate closure table
- Phase 2-5: Drop new tables (data loss acceptable in early phases)

### Data Preservation

- All existing topic data is preserved
- Multi-parent topics become single-parent with additional parents as related
- Existing reviews migrated to `topic_reviews` association
- FSRS state preserved in new `fsrs_states` table with inherited fields

---

## References

- Design documents: `topic-design-problem.md`, `topic-schema.md`, `topic-api-design.md`
- Review consolidation: `topic-review-consolidation.md`
- Current implementation research: `thoughts/shared/research/2026-01-17-current-implementation-topic-redesign.md`
