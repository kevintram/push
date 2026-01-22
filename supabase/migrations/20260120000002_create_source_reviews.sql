-- Migration: Create source_reviews association table
-- Part of Phase 2: Sources Entity

-- ============================================================================
-- SOURCE_REVIEWS ASSOCIATION TABLE
-- ============================================================================
CREATE TABLE source_reviews (
  review_id BIGINT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE
);

-- Index for source_reviews
CREATE INDEX idx_source_reviews_source ON source_reviews(source_id);

-- ============================================================================
-- CASCADE REVIEW DELETION
-- ============================================================================
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

-- ============================================================================
-- FSRS STATE UPDATE TRIGGERS
-- ============================================================================
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

-- ============================================================================
-- EXTEND REVIEW COMPLETION TRIGGER
-- ============================================================================
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
