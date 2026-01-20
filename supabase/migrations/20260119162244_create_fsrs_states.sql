-- Phase 1 Migration 1: Create fsrs_states table
-- This extracts FSRS state from topics into a shared table for Topics, Sources, and Practices

-- Create fsrs_states table with inherited fields
CREATE TABLE fsrs_states (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stability REAL CHECK (stability > 0),
  difficulty REAL CHECK (difficulty >= 0 AND difficulty <= 10),
  state learning_state NOT NULL DEFAULT 'LEARNING',
  step INTEGER,
  last_reviewed_at DATE,
  srs_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Inherited fields (propagated from parent at creation time)
  inherited_stability REAL,
  inherited_difficulty REAL CHECK (inherited_difficulty >= 0 AND inherited_difficulty <= 10),
  inherited_state learning_state,
  inherited_step INTEGER,
  inherited_last_review DATE,
  -- Timestamps
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for updated_at
CREATE TRIGGER update_fsrs_states_updated_at BEFORE UPDATE ON fsrs_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for SRS-enabled queries
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
