-- Phase 1 Migration 5: Update review triggers for new FSRS structure
-- The review trigger now updates fsrs_states.last_reviewed_at instead of topics.last_reviewed_at

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
