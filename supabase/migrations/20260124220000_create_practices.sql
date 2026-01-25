-- Migration: Create practices table and junction tables
-- Practices are exercises with prompt/answer fields (no hierarchy)

-- ============================================================================
-- STEP 1: CREATE PRACTICES TABLE
-- ============================================================================
CREATE TABLE practices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  inboxed BOOLEAN NOT NULL DEFAULT false,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- STEP 2: CREATE PRACTICE_TOPICS JUNCTION TABLE
-- ============================================================================
-- Practice assesses Topic
CREATE TABLE practice_topics (
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (practice_id, topic_id)
);

-- ============================================================================
-- STEP 3: CREATE PRACTICE_SOURCES JUNCTION TABLE
-- ============================================================================
-- Practice assesses Source
CREATE TABLE practice_sources (
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (practice_id, source_id)
);

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================
CREATE INDEX idx_practices_user ON practices(user_id);
CREATE INDEX idx_practices_fsrs ON practices(fsrs_state_id);
CREATE INDEX idx_practices_archived ON practices(archived) WHERE archived = false;
CREATE INDEX idx_practices_inboxed ON practices(inboxed) WHERE inboxed = true;
CREATE INDEX idx_practice_topics_topic ON practice_topics(topic_id);
CREATE INDEX idx_practice_sources_source ON practice_sources(source_id);

-- ============================================================================
-- STEP 5: CREATE TRIGGERS
-- ============================================================================
CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practice_topics_updated_at BEFORE UPDATE ON practice_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practice_sources_updated_at BEFORE UPDATE ON practice_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: UPDATE CLEANUP FUNCTION
-- ============================================================================
-- Update cleanup function to include practices (final version)
CREATE OR REPLACE FUNCTION cleanup_orphaned_fsrs_states()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM fsrs_states
  WHERE id = OLD.fsrs_state_id
    AND NOT EXISTS (SELECT 1 FROM topics WHERE fsrs_state_id = OLD.fsrs_state_id)
    AND NOT EXISTS (SELECT 1 FROM sources WHERE fsrs_state_id = OLD.fsrs_state_id)
    AND NOT EXISTS (SELECT 1 FROM practices WHERE fsrs_state_id = OLD.fsrs_state_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Cleanup orphaned fsrs_states when practice is deleted
CREATE TRIGGER cleanup_fsrs_after_practice_delete
  AFTER DELETE ON practices
  FOR EACH ROW
  WHEN (OLD.fsrs_state_id IS NOT NULL)
  EXECUTE FUNCTION cleanup_orphaned_fsrs_states();
