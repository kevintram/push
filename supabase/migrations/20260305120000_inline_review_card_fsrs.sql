ALTER TABLE review_cards
  ADD COLUMN IF NOT EXISTS stability REAL,
  ADD COLUMN IF NOT EXISTS difficulty REAL,
  ADD COLUMN IF NOT EXISTS state learning_state NOT NULL DEFAULT 'LEARNING',
  ADD COLUMN IF NOT EXISTS step INTEGER,
  ADD COLUMN IF NOT EXISTS last_reviewed_at DATE,
  ADD COLUMN IF NOT EXISTS retired BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inherited_stability REAL,
  ADD COLUMN IF NOT EXISTS inherited_difficulty REAL,
  ADD COLUMN IF NOT EXISTS inherited_state learning_state,
  ADD COLUMN IF NOT EXISTS inherited_step INTEGER,
  ADD COLUMN IF NOT EXISTS inherited_last_review DATE;

UPDATE review_cards AS rc
SET
  stability = fs.stability,
  difficulty = fs.difficulty,
  state = COALESCE(fs.state, 'LEARNING'),
  step = fs.step,
  last_reviewed_at = fs.last_reviewed_at,
  retired = NOT fs.srs_enabled,
  inherited_stability = fs.inherited_stability,
  inherited_difficulty = fs.inherited_difficulty,
  inherited_state = fs.inherited_state,
  inherited_step = fs.inherited_step,
  inherited_last_review = fs.inherited_last_review
FROM fsrs_states AS fs
WHERE rc.fsrs_state_id = fs.id;

UPDATE review_cards
SET retired = true
WHERE fsrs_state_id IS NULL;

DROP INDEX IF EXISTS idx_review_cards_fsrs;
ALTER TABLE review_cards DROP COLUMN IF EXISTS fsrs_state_id;

DROP TABLE IF EXISTS source_topics CASCADE;
DROP TABLE IF EXISTS source_reviews CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS practice_topics CASCADE;
DROP TABLE IF EXISTS practice_sources CASCADE;
DROP TABLE IF EXISTS practices CASCADE;

DROP FUNCTION IF EXISTS cleanup_orphaned_fsrs_states() CASCADE;
DROP FUNCTION IF EXISTS update_last_reviewed(BIGINT, DATE) CASCADE;
DROP FUNCTION IF EXISTS recalc_last_reviewed(BIGINT, TEXT, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS refresh_last_reviewed_on_completion() CASCADE;
DROP FUNCTION IF EXISTS update_entity_fsrs_on_review() CASCADE;
DROP FUNCTION IF EXISTS update_source_fsrs_on_review() CASCADE;

DROP TABLE IF EXISTS fsrs_states CASCADE;
