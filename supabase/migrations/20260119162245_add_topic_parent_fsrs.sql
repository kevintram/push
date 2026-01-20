-- Phase 1 Migration 2: Add parent_id, path (ltree), and fsrs_state_id to topics
-- This converts topics from graph (closure table) to tree (parent_id) structure

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
