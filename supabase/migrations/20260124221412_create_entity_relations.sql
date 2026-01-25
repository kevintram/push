-- Entity relations table for topic/source ↔ topic/source relations
-- Replaces topic_other_relations with a more flexible polymorphic structure
CREATE TABLE entity_relations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  from_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  to_topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
  to_source_id BIGINT REFERENCES sources(id) ON DELETE CASCADE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Exactly one 'from' entity
  CONSTRAINT exactly_one_from CHECK (num_nonnulls(from_topic_id, from_source_id) = 1),
  -- Exactly one 'to' entity
  CONSTRAINT exactly_one_to CHECK (num_nonnulls(to_topic_id, to_source_id) = 1),
  -- No self-relations for same entity type (only checked when both are NOT NULL)
  CONSTRAINT no_self_relation CHECK (
    (from_topic_id IS NULL OR to_topic_id IS NULL OR from_topic_id <> to_topic_id)
    AND (from_source_id IS NULL OR to_source_id IS NULL OR from_source_id <> to_source_id)
  ),
  -- Unique relation (nulls handled correctly)
  CONSTRAINT unique_relation UNIQUE NULLS NOT DISTINCT (from_topic_id, from_source_id, to_topic_id, to_source_id)
);

-- Indexes for lookups
CREATE INDEX idx_entity_relations_from_topic ON entity_relations(from_topic_id) WHERE from_topic_id IS NOT NULL;
CREATE INDEX idx_entity_relations_from_source ON entity_relations(from_source_id) WHERE from_source_id IS NOT NULL;
CREATE INDEX idx_entity_relations_to_topic ON entity_relations(to_topic_id) WHERE to_topic_id IS NOT NULL;
CREATE INDEX idx_entity_relations_to_source ON entity_relations(to_source_id) WHERE to_source_id IS NOT NULL;

-- Migrate existing topic_other_relations data
INSERT INTO entity_relations (from_topic_id, to_topic_id, inserted_at, updated_at)
SELECT from_topic_id, to_topic_id, inserted_at, updated_at
FROM topic_other_relations;

-- Drop old table
DROP TABLE topic_other_relations;

-- Trigger for updated_at
CREATE TRIGGER update_entity_relations_updated_at BEFORE UPDATE ON entity_relations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
