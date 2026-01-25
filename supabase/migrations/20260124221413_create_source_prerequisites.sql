-- Source prerequisites: what must be learned before a source
-- Prerequisites can be either topics or other sources
CREATE TABLE source_prerequisites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  prereq_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  prereq_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Exactly one prerequisite type
  CONSTRAINT exactly_one_prereq CHECK (num_nonnulls(prereq_topic_id, prereq_source_id) = 1),
  -- No self-prereq for sources
  CONSTRAINT no_self_prereq CHECK (source_id IS DISTINCT FROM prereq_source_id),
  -- Unique prerequisite
  CONSTRAINT unique_prereq UNIQUE NULLS NOT DISTINCT (source_id, prereq_topic_id, prereq_source_id)
);

-- Indexes
CREATE INDEX idx_source_prerequisites_source ON source_prerequisites(source_id);
CREATE INDEX idx_source_prerequisites_prereq_topic ON source_prerequisites(prereq_topic_id) WHERE prereq_topic_id IS NOT NULL;
CREATE INDEX idx_source_prerequisites_prereq_source ON source_prerequisites(prereq_source_id) WHERE prereq_source_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_source_prerequisites_updated_at BEFORE UPDATE ON source_prerequisites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
