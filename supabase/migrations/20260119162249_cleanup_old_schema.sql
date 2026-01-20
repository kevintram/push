-- Phase 1 Migration 6: Cleanup old FSRS columns and closure table
-- This removes the deprecated columns after migration is complete

-- Remove FSRS columns from topics (now in fsrs_states)
ALTER TABLE topics
  DROP COLUMN IF EXISTS stability,
  DROP COLUMN IF EXISTS difficulty,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS step,
  DROP COLUMN IF EXISTS last_reviewed_at,
  DROP COLUMN IF EXISTS srs_enabled,
  DROP COLUMN IF EXISTS inherited_stability,
  DROP COLUMN IF EXISTS inherited_difficulty,
  DROP COLUMN IF EXISTS inherited_state,
  DROP COLUMN IF EXISTS inherited_step,
  DROP COLUMN IF EXISTS inherited_last_review;

-- Drop triggers first (before dropping their associated functions)
DROP TRIGGER IF EXISTS insert_topic_reflexive_path_closure ON topics;
DROP TRIGGER IF EXISTS update_topics_closure_updated_at ON topics_closure;

-- Drop closure table functions
DROP FUNCTION IF EXISTS insert_relationship(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS insert_relationship(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS delete_relationship(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS delete_relationship(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS insert_topic_reflexive_path();
DROP FUNCTION IF EXISTS insert_topic_reflexive_path(INTEGER);
DROP FUNCTION IF EXISTS insert_topic_reflexive_path(BIGINT);
DROP FUNCTION IF EXISTS get_potential_parents(BIGINT, TEXT);
DROP FUNCTION IF EXISTS get_potential_children(BIGINT, TEXT);

-- Drop closure table
DROP TABLE IF EXISTS topics_closure;
