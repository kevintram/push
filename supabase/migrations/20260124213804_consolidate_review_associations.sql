-- Migration: Consolidate review associations
-- Replace source_reviews/topic_reviews association tables with direct FK on reviews table

-- ============================================================================
-- STEP 1: ADD SOURCE_ID COLUMN TO REVIEWS
-- ============================================================================
ALTER TABLE reviews ADD COLUMN source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE;
CREATE INDEX idx_reviews_source_id ON reviews(source_id);
CREATE INDEX idx_reviews_topic_id ON reviews(topic_id);

-- ============================================================================
-- STEP 2: MIGRATE DATA FROM SOURCE_REVIEWS
-- ============================================================================
UPDATE reviews r SET source_id = sr.source_id FROM source_reviews sr WHERE r.id = sr.review_id;

-- ============================================================================
-- STEP 3: ADD CHECK CONSTRAINT
-- ============================================================================
-- Exactly one of topic_id or source_id must be set
ALTER TABLE reviews ADD CONSTRAINT reviews_entity_type_check
CHECK ((topic_id IS NOT NULL)::int + (source_id IS NOT NULL)::int = 1);

-- ============================================================================
-- STEP 4: UPDATE RECALC_LAST_REVIEWED TO USE DIRECT FK
-- ============================================================================
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
  END IF;

  UPDATE fsrs_states
  SET last_reviewed_at = v_max_completed
  WHERE id = p_fsrs_state_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: UPDATE REFRESH_LAST_REVIEWED_ON_COMPLETION TO USE DIRECT FK
-- ============================================================================
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

  -- Check if it's a topic review (using direct FK)
  IF NEW.topic_id IS NOT NULL THEN
    SELECT fsrs_state_id INTO v_fsrs_state_id FROM topics WHERE id = NEW.topic_id;
    v_entity_id := NEW.topic_id;
    v_entity_type := 'topic';
  -- Check if it's a source review (using direct FK)
  ELSIF NEW.source_id IS NOT NULL THEN
    SELECT fsrs_state_id INTO v_fsrs_state_id FROM sources WHERE id = NEW.source_id;
    v_entity_id := NEW.source_id;
    v_entity_type := 'source';
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

-- ============================================================================
-- STEP 6: CREATE NEW TRIGGER FOR REVIEWS INSERT/DELETE
-- ============================================================================
-- Replaces the association table triggers with a single trigger on reviews

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

CREATE TRIGGER trg_reviews_fsrs
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_entity_fsrs_on_review();

-- ============================================================================
-- STEP 7: DROP OLD TRIGGERS AND FUNCTIONS
-- ============================================================================
-- Drop triggers on association tables
DROP TRIGGER IF EXISTS trg_source_reviews_fsrs ON source_reviews;
DROP TRIGGER IF EXISTS cascade_review_delete_source ON source_reviews;
DROP TRIGGER IF EXISTS cascade_review_delete_topic ON topic_reviews;
DROP TRIGGER IF EXISTS trg_update_topic_last_reviewed ON topic_reviews;

-- Drop functions that were for association tables
DROP FUNCTION IF EXISTS update_source_fsrs_on_review();
DROP FUNCTION IF EXISTS cascade_review_delete_on_source_reviews();
DROP FUNCTION IF EXISTS cascade_review_delete_on_topic_reviews();
DROP FUNCTION IF EXISTS update_topic_last_reviewed();

-- ============================================================================
-- STEP 8: DROP ASSOCIATION TABLES
-- ============================================================================
DROP TABLE source_reviews;
DROP TABLE topic_reviews;
