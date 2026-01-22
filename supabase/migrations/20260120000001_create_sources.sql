-- Migration: Create sources table and source_topics junction
-- Part of Phase 2: Sources Entity

-- ============================================================================
-- SOURCES TABLE
-- ============================================================================
-- Sources table with ltree path for hierarchy (mirrors topics structure)
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

-- ============================================================================
-- SOURCE_TOPICS JUNCTION TABLE
-- ============================================================================
-- Source covers Topic junction
CREATE TABLE source_topics (
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (source_id, topic_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_sources_parent ON sources(parent_id);
CREATE INDEX idx_sources_path_gist ON sources USING GIST (path);
CREATE INDEX idx_sources_user ON sources(user_id);
CREATE INDEX idx_sources_fsrs ON sources(fsrs_state_id);
CREATE INDEX idx_source_topics_topic ON source_topics(topic_id);

-- ============================================================================
-- UPDATE CLEANUP FUNCTION FOR ORPHANED FSRS STATES
-- ============================================================================
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

-- ============================================================================
-- PATH MAINTENANCE FUNCTIONS AND TRIGGERS
-- ============================================================================
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

-- ============================================================================
-- TIMESTAMP TRIGGERS
-- ============================================================================
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_source_topics_updated_at BEFORE UPDATE ON source_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
