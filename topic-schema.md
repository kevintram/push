# Topic System Schema

Relational database schema implementing the design in `topic-design-problem.md`.

---

## Enums

```sql
CREATE TYPE learning_state AS ENUM ('LEARNING', 'REVIEW', 'RELEARNING');
CREATE TYPE rating AS ENUM ('MISS', 'HARD', 'GOOD', 'EASY');
```

---

## Extensions

```sql
-- ltree extension for materialized path hierarchy
-- Enables O(1) ancestry/descendant checks via path operators (<@, @>)
CREATE EXTENSION IF NOT EXISTS ltree;
```

---

## Trigger Functions

### updated_at Auto-Update

Automatically updates `updated_at` timestamp on row modification.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';
```

Applied to all tables with `updated_at`:

```sql
CREATE TRIGGER update_fsrs_states_updated_at BEFORE UPDATE ON fsrs_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_relations_updated_at BEFORE UPDATE ON entity_relations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_topics_updated_at BEFORE UPDATE ON source_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_topics_updated_at BEFORE UPDATE ON practice_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_sources_updated_at BEFORE UPDATE ON practice_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_prerequisites_updated_at BEFORE UPDATE ON source_prerequisites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_sessions_updated_at BEFORE UPDATE ON review_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Shared Tables

### fsrs_states

FSRS scheduling state shared across all entity types. Includes inherited fields for parent-propagated state in hierarchical entities (topics, sources).

```sql
CREATE TABLE fsrs_states (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stability REAL CHECK (stability > 0),
  difficulty REAL CHECK (difficulty >= 0 AND difficulty <= 10),
  state learning_state NOT NULL DEFAULT 'LEARNING',
  step INTEGER,
  last_reviewed_at DATE,
  srs_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Inherited fields (propagated from parent entity's FSRS state)
  inherited_stability REAL,
  inherited_difficulty REAL CHECK (inherited_difficulty >= 0 AND inherited_difficulty <= 10),
  inherited_state learning_state,
  inherited_step INTEGER,
  inherited_last_review DATE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

> **Note:** The `inherited_*` fields store FSRS state propagated from an entity's parent. This allows child entities to inherit review scheduling from their parent when they don't have their own review history. Application logic is responsible for propagating these values when parent FSRS state changes.

---

## Core Tables

### topics

Units of knowledge, skills, techniques, ideas.

```sql
CREATE TABLE topics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  parent_id BIGINT REFERENCES topics(id) ON DELETE RESTRICT,
  path ltree,  -- Materialized path for O(1) ancestry checks (format: "root_id.parent_id.child_id")
  fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL,

  -- Status
  archived BOOLEAN NOT NULL DEFAULT false,
  inboxed BOOLEAN NOT NULL DEFAULT false,

  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

> **Note:** `ON DELETE RESTRICT` requires application-level handling. See API documentation for delete options (delete children, orphan children, or reparent to grandparent).

> **Note:** The `path` column is maintained by triggers that compute the path on insert and update descendant paths when a topic moves. See implementation plan for trigger definitions.

### sources

Created works or portions thereof (recursive nesting).

```sql
CREATE TABLE sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  parent_id BIGINT REFERENCES sources(id) ON DELETE RESTRICT,
  path ltree,  -- Materialized path for O(1) ancestry checks (format: "root_id.parent_id.child_id")
  fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL,

  -- Status
  archived BOOLEAN NOT NULL DEFAULT false,
  inboxed BOOLEAN NOT NULL DEFAULT false,

  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

> **Note:** `ON DELETE RESTRICT` requires application-level handling. See API documentation for delete options (delete children, orphan children, or reparent to grandparent).

> **Note:** The `path` column is maintained by triggers that compute the path on insert and update descendant paths when a source moves. See implementation plan for trigger definitions.

### practices

Activities with prompts.

```sql
CREATE TABLE practices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL,

  -- Status
  archived BOOLEAN NOT NULL DEFAULT false,
  inboxed BOOLEAN NOT NULL DEFAULT false,

  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## Junction Tables

### entity_relations

Unified related_to relationship between any combination of Topics and Sources.

```sql
CREATE TABLE entity_relations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  from_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  to_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  to_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Exactly one "from" entity must be set
  CONSTRAINT exactly_one_from CHECK (
    num_nonnulls(from_topic_id, from_source_id) = 1
  ),
  -- Exactly one "to" entity must be set
  CONSTRAINT exactly_one_to CHECK (
    num_nonnulls(to_topic_id, to_source_id) = 1
  ),
  -- Prevent self-relations (entity cannot be related to itself)
  CONSTRAINT no_self_relation CHECK (
    from_topic_id IS DISTINCT FROM to_topic_id
    AND from_source_id IS DISTINCT FROM to_source_id
  ),
  -- Prevent duplicate relations (NULLS NOT DISTINCT ensures NULL = NULL for uniqueness)
  CONSTRAINT unique_relation UNIQUE NULLS NOT DISTINCT (from_topic_id, from_source_id, to_topic_id, to_source_id)
);
```

---

### source_topics

Source covers Topic.

```sql
CREATE TABLE source_topics (
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (source_id, topic_id)
);
```

### practice_topics

Practice assesses Topic.

```sql
CREATE TABLE practice_topics (
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (practice_id, topic_id)
);
```

### practice_sources

Practice assesses Source.

```sql
CREATE TABLE practice_sources (
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (practice_id, source_id)
);
```

### source_prerequisites

Source assumes knowledge of Topic or completion of another Source.

```sql
CREATE TABLE source_prerequisites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  prereq_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  prereq_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Exactly one prerequisite type must be set
  CONSTRAINT exactly_one_prereq CHECK (
    num_nonnulls(prereq_topic_id, prereq_source_id) = 1
  ),
  -- Prevent self-prerequisites (source cannot require itself)
  CONSTRAINT no_self_prereq CHECK (
    source_id IS DISTINCT FROM prereq_source_id
  ),
  -- Prevent duplicate prerequisites
  CONSTRAINT unique_prereq UNIQUE NULLS NOT DISTINCT (source_id, prereq_topic_id, prereq_source_id)
);
```

---

## Review Tables

Shared review data with association tables for type-safe FKs.

### review_sessions

Groups reviews into sessions.

```sql
CREATE TABLE review_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  scheduled_at DATE,
  completed_at DATE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### reviews

Core review data shared across all entity types.

```sql
CREATE TABLE reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  review_session_id BIGINT REFERENCES review_sessions(id) ON DELETE SET NULL,

  scheduled_at DATE,
  completed_at DATE,
  rating rating,
  description TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',

  -- FSRS state before review
  stability_before REAL,
  difficulty_before REAL,
  state_before learning_state,
  step_before INTEGER,

  -- FSRS state after review
  stability_after REAL,
  difficulty_after REAL,
  state_after learning_state,
  step_after INTEGER,

  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### topic_reviews

Associates reviews with topics. Deleting a topic cascades to delete its reviews.

```sql
CREATE TABLE topic_reviews (
  review_id BIGINT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE
);

-- When topic is deleted, also delete the associated review
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

### source_reviews

Associates reviews with sources. Deleting a source cascades to delete its reviews.

```sql
CREATE TABLE source_reviews (
  review_id BIGINT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE
);

-- When source is deleted, also delete the associated review
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
```

### practice_reviews

Associates reviews with practices. Deleting a practice cascades to delete its reviews.

```sql
CREATE TABLE practice_reviews (
  review_id BIGINT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE
);

-- When practice is deleted, also delete the associated review
CREATE OR REPLACE FUNCTION cascade_review_delete_on_practice_reviews()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM reviews WHERE id = OLD.review_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_review_delete_practice
  AFTER DELETE ON practice_reviews
  FOR EACH ROW EXECUTE FUNCTION cascade_review_delete_on_practice_reviews();
```

---

## Orphaned FSRS State Cleanup

When an entity is deleted, its `fsrs_state_id` is set to NULL (via `ON DELETE SET NULL`), leaving orphaned `fsrs_states` records. This trigger cleans them up.

> **Note:** The `NOT EXISTS` subqueries use the `idx_topics_fsrs`, `idx_sources_fsrs`, and `idx_practices_fsrs` indexes for efficient lookups.

```sql
-- Delete fsrs_states that are no longer referenced by any entity
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

CREATE TRIGGER cleanup_fsrs_after_topic_delete
  AFTER DELETE ON topics
  FOR EACH ROW
  WHEN (OLD.fsrs_state_id IS NOT NULL)
  EXECUTE FUNCTION cleanup_orphaned_fsrs_states();

CREATE TRIGGER cleanup_fsrs_after_source_delete
  AFTER DELETE ON sources
  FOR EACH ROW
  WHEN (OLD.fsrs_state_id IS NOT NULL)
  EXECUTE FUNCTION cleanup_orphaned_fsrs_states();

CREATE TRIGGER cleanup_fsrs_after_practice_delete
  AFTER DELETE ON practices
  FOR EACH ROW
  WHEN (OLD.fsrs_state_id IS NOT NULL)
  EXECUTE FUNCTION cleanup_orphaned_fsrs_states();
```

---

## Indexes

```sql
-- Hierarchy traversal
CREATE INDEX idx_topics_parent ON topics(parent_id);
CREATE INDEX idx_sources_parent ON sources(parent_id);

-- ltree path indexes for O(1) ancestry/descendant queries
CREATE INDEX idx_topics_path_gist ON topics USING GIST (path);
CREATE INDEX idx_sources_path_gist ON sources USING GIST (path);

-- User filtering
CREATE INDEX idx_topics_user ON topics(user_id);
CREATE INDEX idx_sources_user ON sources(user_id);
CREATE INDEX idx_practices_user ON practices(user_id);

-- FSRS foreign keys
CREATE INDEX idx_topics_fsrs ON topics(fsrs_state_id);
CREATE INDEX idx_sources_fsrs ON sources(fsrs_state_id);
CREATE INDEX idx_practices_fsrs ON practices(fsrs_state_id);

-- Entity relations (unified related_to)
CREATE INDEX idx_entity_relations_from_topic ON entity_relations(from_topic_id) WHERE from_topic_id IS NOT NULL;
CREATE INDEX idx_entity_relations_from_source ON entity_relations(from_source_id) WHERE from_source_id IS NOT NULL;
CREATE INDEX idx_entity_relations_to_topic ON entity_relations(to_topic_id) WHERE to_topic_id IS NOT NULL;
CREATE INDEX idx_entity_relations_to_source ON entity_relations(to_source_id) WHERE to_source_id IS NOT NULL;

-- Junction table lookups (reverse direction)
CREATE INDEX idx_source_topics_topic ON source_topics(topic_id);
CREATE INDEX idx_source_prerequisites_topic ON source_prerequisites(prereq_topic_id) WHERE prereq_topic_id IS NOT NULL;
CREATE INDEX idx_source_prerequisites_source ON source_prerequisites(prereq_source_id) WHERE prereq_source_id IS NOT NULL;
CREATE INDEX idx_practice_topics_topic ON practice_topics(topic_id);
CREATE INDEX idx_practice_sources_source ON practice_sources(source_id);

-- Review lookups
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_session ON reviews(review_session_id);
CREATE INDEX idx_reviews_scheduled ON reviews(user_id, scheduled_at) WHERE completed_at IS NULL;

CREATE INDEX idx_topic_reviews_topic ON topic_reviews(topic_id);
CREATE INDEX idx_source_reviews_source ON source_reviews(source_id);
CREATE INDEX idx_practice_reviews_practice ON practice_reviews(practice_id);

CREATE INDEX idx_review_sessions_user ON review_sessions(user_id);
```

---

## Conventions Applied

| Convention | Applied |
|------------|---------|
| IDs | `BIGINT GENERATED ALWAYS AS IDENTITY` |
| Timestamps | `inserted_at`/`updated_at` with `timezone('utc'::text, now())` |
| Timestamp updates | Trigger function auto-updates `updated_at` on modification |
| User ownership | `user_id TEXT NOT NULL` on core entities (topics, sources, practices, reviews, review_sessions) |
| Text fields | `TEXT NOT NULL DEFAULT ''` |
| Table names | Plural (`topics`, `sources`, `practices`) |
| Foreign keys | `BIGINT` with `{table}_id` naming |
| Parent deletion | `ON DELETE RESTRICT` with application-level handling (user chooses: delete/orphan/reparent) |
| Entity relations | Unified `entity_relations` table with nullable FKs, check constraints, and `NULLS NOT DISTINCT` uniqueness |
| Practice relations | Junction tables for topics (`practice_topics`) and sources (`practice_sources`) |
| Source relations | Junction tables for topics (`source_topics`) and prerequisites (`source_prerequisites` with nullable `prereq_topic_id` / `prereq_source_id`) |
| FSRS state | Shared `fsrs_states` table, 1:1 relationship via `UNIQUE` constraint on `fsrs_state_id` FK |
| Reviews | Shared `reviews` table + minimal association tables for type-safe FKs |