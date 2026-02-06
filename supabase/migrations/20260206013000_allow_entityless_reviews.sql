-- Allow reviews without an associated entity (0 or 1 reference)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_entity_type_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_entity_type_check
CHECK ((topic_id IS NOT NULL)::int + (source_id IS NOT NULL)::int + (practice_id IS NOT NULL)::int <= 1);

-- Keep fsrs_states.last_reviewed_at in sync when a review changes completion or linked entity.

CREATE OR REPLACE FUNCTION refresh_last_reviewed_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  old_fsrs_state_id BIGINT;
  old_entity_id BIGINT;
  old_entity_type TEXT;
  new_fsrs_state_id BIGINT;
  new_entity_id BIGINT;
  new_entity_type TEXT;
BEGIN
  IF NEW.completed_at IS NOT DISTINCT FROM OLD.completed_at
    AND NEW.topic_id IS NOT DISTINCT FROM OLD.topic_id
    AND NEW.source_id IS NOT DISTINCT FROM OLD.source_id
    AND NEW.practice_id IS NOT DISTINCT FROM OLD.practice_id THEN
    RETURN NEW;
  END IF;

  IF OLD.topic_id IS NOT NULL THEN
    old_entity_type := 'topic';
    old_entity_id := OLD.topic_id;
    SELECT fsrs_state_id INTO old_fsrs_state_id FROM topics WHERE id = OLD.topic_id;
  ELSIF OLD.source_id IS NOT NULL THEN
    old_entity_type := 'source';
    old_entity_id := OLD.source_id;
    SELECT fsrs_state_id INTO old_fsrs_state_id FROM sources WHERE id = OLD.source_id;
  ELSIF OLD.practice_id IS NOT NULL THEN
    old_entity_type := 'practice';
    old_entity_id := OLD.practice_id;
    SELECT fsrs_state_id INTO old_fsrs_state_id FROM practices WHERE id = OLD.practice_id;
  END IF;

  IF NEW.topic_id IS NOT NULL THEN
    new_entity_type := 'topic';
    new_entity_id := NEW.topic_id;
    SELECT fsrs_state_id INTO new_fsrs_state_id FROM topics WHERE id = NEW.topic_id;
  ELSIF NEW.source_id IS NOT NULL THEN
    new_entity_type := 'source';
    new_entity_id := NEW.source_id;
    SELECT fsrs_state_id INTO new_fsrs_state_id FROM sources WHERE id = NEW.source_id;
  ELSIF NEW.practice_id IS NOT NULL THEN
    new_entity_type := 'practice';
    new_entity_id := NEW.practice_id;
    SELECT fsrs_state_id INTO new_fsrs_state_id FROM practices WHERE id = NEW.practice_id;
  END IF;

  IF old_fsrs_state_id IS NOT NULL THEN
    PERFORM recalc_last_reviewed(old_fsrs_state_id, old_entity_type, old_entity_id);
  END IF;

  IF new_fsrs_state_id IS NOT NULL
    AND (
      old_entity_type IS DISTINCT FROM new_entity_type
      OR old_entity_id IS DISTINCT FROM new_entity_id
      OR old_fsrs_state_id IS DISTINCT FROM new_fsrs_state_id
    ) THEN
    PERFORM recalc_last_reviewed(new_fsrs_state_id, new_entity_type, new_entity_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_last_reviewed_on_completion ON reviews;
CREATE TRIGGER trg_refresh_last_reviewed_on_completion
  AFTER UPDATE OF completed_at, topic_id, source_id, practice_id ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_last_reviewed_on_completion();
