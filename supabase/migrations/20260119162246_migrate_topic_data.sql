-- Phase 1 Migration 3: Migrate FSRS state and hierarchy data
-- This migration is idempotent and can be re-run safely

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
    WHERE fsrs_state_id IS NULL  -- Only migrate topics that haven't been migrated yet
      AND (srs_enabled = true OR stability IS NOT NULL)
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
-- Only update topics that don't already have a parent_id set
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
WHERE t.id = fp.topic_id
  AND t.parent_id IS NULL;

-- Step 4: Move additional parents to related
-- Only insert relations that don't already exist
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
