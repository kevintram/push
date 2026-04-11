-- Final one-shot cutover to topics + review_cards + review_card-linked reviews.
-- This squashed migration replaces the transitional pair:
--   1) 20260303120000_topics_and_review_cards.sql
--   2) 20260304090000_retire_legacy_notes.sql

-- Introduce explicit topics + review_cards model.
-- Transitional migration:
-- - Keeps legacy notes tables/endpoints alive for now.
-- - Backfills topics/review_cards from notes.
-- - Adds reviews.review_card_id while retaining reviews.note_id.

DO $$
BEGIN
  CREATE TYPE review_card_type AS ENUM ('practice', 'flashcard');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS topics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  parent_id BIGINT REFERENCES topics(id) ON DELETE RESTRICT,
  path ltree,
  archived BOOLEAN NOT NULL DEFAULT false,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS review_cards (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  type review_card_type NOT NULL,
  primary_text TEXT NOT NULL DEFAULT '',
  secondary_text TEXT NOT NULL DEFAULT '',
  fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_topics_user ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_topics_path_gist ON topics USING GIST(path);
CREATE INDEX IF NOT EXISTS idx_topics_archived ON topics(user_id, archived);

CREATE INDEX IF NOT EXISTS idx_review_cards_user ON review_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_review_cards_topic ON review_cards(topic_id);
CREATE INDEX IF NOT EXISTS idx_review_cards_type ON review_cards(user_id, type);
CREATE INDEX IF NOT EXISTS idx_review_cards_archived ON review_cards(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_review_cards_fsrs ON review_cards(fsrs_state_id);

CREATE OR REPLACE FUNCTION compute_topics_path(topic_id BIGINT, topic_parent_id BIGINT)
RETURNS ltree AS $$
DECLARE
  parent_path ltree;
BEGIN
  IF topic_parent_id IS NULL THEN
    RETURN topic_id::text::ltree;
  END IF;

  SELECT path INTO parent_path FROM topics WHERE id = topic_parent_id;
  RETURN parent_path || topic_id::text::ltree;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION maintain_topics_path()
RETURNS TRIGGER AS $$
BEGIN
  NEW.path := compute_topics_path(NEW.id, NEW.parent_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_topics_path_insert ON topics;
CREATE TRIGGER trg_topics_path_insert
  BEFORE INSERT ON topics
  FOR EACH ROW EXECUTE FUNCTION maintain_topics_path();

DROP TRIGGER IF EXISTS trg_topics_path_update ON topics;
CREATE TRIGGER trg_topics_path_update
  BEFORE UPDATE OF parent_id ON topics
  FOR EACH ROW
  WHEN (OLD.parent_id IS DISTINCT FROM NEW.parent_id)
  EXECUTE FUNCTION maintain_topics_path();

CREATE OR REPLACE FUNCTION update_topic_descendant_paths_v2()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE topics
  SET path = NEW.path || subpath(path, nlevel(OLD.path))
  WHERE path <@ OLD.path AND id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_topics_descendant_paths_v2 ON topics;
CREATE TRIGGER trg_topics_descendant_paths_v2
  AFTER UPDATE OF path ON topics
  FOR EACH ROW
  WHEN (OLD.path IS DISTINCT FROM NEW.path)
  EXECUTE FUNCTION update_topic_descendant_paths_v2();

DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_review_cards_updated_at ON review_cards;
CREATE TRIGGER update_review_cards_updated_at BEFORE UPDATE ON review_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS review_card_id BIGINT REFERENCES review_cards(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reviews_review_card_id ON reviews(review_card_id);

ALTER TABLE reviews
  ALTER COLUMN note_id DROP NOT NULL;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_note_or_card_required_check;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_note_or_card_required_check
  CHECK (note_id IS NOT NULL OR review_card_id IS NOT NULL);

DROP TABLE IF EXISTS topic_note_migration_map;
CREATE TEMP TABLE topic_note_migration_map (
  note_id BIGINT PRIMARY KEY,
  topic_id BIGINT UNIQUE NOT NULL
) ON COMMIT DROP;

DROP TABLE IF EXISTS review_card_note_migration_map;
CREATE TEMP TABLE review_card_note_migration_map (
  note_id BIGINT PRIMARY KEY,
  review_card_id BIGINT UNIQUE NOT NULL
) ON COMMIT DROP;

DROP TABLE IF EXISTS imported_topic_map;
CREATE TEMP TABLE imported_topic_map (
  user_id TEXT PRIMARY KEY,
  topic_id BIGINT NOT NULL
) ON COMMIT DROP;

DO $$
DECLARE
  note_row RECORD;
  user_row RECORD;
  new_topic_id BIGINT;
  fallback_topic_id BIGINT;
  topic_for_card_id BIGINT;
  new_review_card_id BIGINT;
BEGIN
  -- 1) Migrate SOURCE/TOPIC notes into topics.
  FOR note_row IN
    SELECT DISTINCT src_note.*
    FROM notes src_note
    JOIN note_tags nt ON nt.note_id = src_note.id
    WHERE nt.tag IN ('TOPIC', 'SOURCE')
    ORDER BY src_note.inserted_at, src_note.id
  LOOP
    INSERT INTO topics (
      user_id,
      title,
      body,
      parent_id,
      path,
      archived,
      inserted_at,
      updated_at
    )
    VALUES (
      note_row.user_id,
      note_row.title,
      note_row.body,
      NULL,
      NULL,
      note_row.archived,
      note_row.inserted_at,
      note_row.updated_at
    )
    RETURNING id INTO new_topic_id;

    INSERT INTO topic_note_migration_map (note_id, topic_id)
    VALUES (note_row.id, new_topic_id)
    ON CONFLICT (note_id) DO NOTHING;
  END LOOP;

  -- Preserve topic parent hierarchy where parent also mapped to a topic.
  UPDATE topics t
  SET parent_id = parent_map.topic_id
  FROM topic_note_migration_map self_map
  JOIN notes n ON n.id = self_map.note_id
  JOIN topic_note_migration_map parent_map ON parent_map.note_id = n.parent_id
  WHERE t.id = self_map.topic_id;

  -- Recompute descendant paths once parent links are set.
  UPDATE topics
  SET parent_id = parent_id
  WHERE parent_id IS NOT NULL;

  -- 2) Ensure each user needing fallback topic has an Imported topic.
  FOR user_row IN
    SELECT DISTINCT src_note.user_id
    FROM notes src_note
    LEFT JOIN note_tags nt_practice
      ON nt_practice.note_id = src_note.id AND nt_practice.tag = 'PRACTICE'
    LEFT JOIN topic_note_migration_map tm ON tm.note_id = src_note.id
    LEFT JOIN reviews r ON r.note_id = src_note.id
    WHERE nt_practice.note_id IS NOT NULL
       OR (tm.note_id IS NULL AND r.id IS NOT NULL)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM imported_topic_map it WHERE it.user_id = user_row.user_id
    ) THEN
      INSERT INTO topics (
        user_id,
        title,
        body,
        archived
      )
      VALUES (
        user_row.user_id,
        'Imported',
        'Auto-created fallback topic for migrated review cards.',
        false
      )
      RETURNING id INTO fallback_topic_id;

      INSERT INTO imported_topic_map (user_id, topic_id)
      VALUES (user_row.user_id, fallback_topic_id);
    END IF;
  END LOOP;

  -- 3) Practice-tagged notes -> practice review cards.
  FOR note_row IN
    SELECT DISTINCT src_note.*
    FROM notes src_note
    JOIN note_tags nt ON nt.note_id = src_note.id
    WHERE nt.tag = 'PRACTICE'
    ORDER BY src_note.inserted_at, src_note.id
  LOOP
    topic_for_card_id := NULL;

    -- Prefer mapped parent topic.
    SELECT tm.topic_id INTO topic_for_card_id
    FROM topic_note_migration_map tm
    JOIN notes parent_note ON parent_note.id = tm.note_id
    WHERE parent_note.id = note_row.parent_id;

    -- Fallback: first mapped ASSESSES target.
    IF topic_for_card_id IS NULL THEN
      SELECT tm.topic_id INTO topic_for_card_id
      FROM note_relations nr
      JOIN topic_note_migration_map tm ON tm.note_id = nr.to_id
      WHERE nr.from_id = note_row.id
        AND nr.relation_type = 'ASSESSES'
      ORDER BY nr.inserted_at, nr.id
      LIMIT 1;
    END IF;

    -- Fallback: Imported topic for this user.
    IF topic_for_card_id IS NULL THEN
      SELECT it.topic_id INTO topic_for_card_id
      FROM imported_topic_map it
      WHERE it.user_id = note_row.user_id;
    END IF;

    INSERT INTO review_cards (
      user_id,
      topic_id,
      type,
      primary_text,
      secondary_text,
      fsrs_state_id,
      archived,
      inserted_at,
      updated_at
    )
    VALUES (
      note_row.user_id,
      topic_for_card_id,
      'practice'::review_card_type,
      note_row.title,
      note_row.body,
      note_row.fsrs_state_id,
      note_row.archived,
      note_row.inserted_at,
      note_row.updated_at
    )
    RETURNING id INTO new_review_card_id;

    INSERT INTO review_card_note_migration_map (note_id, review_card_id)
    VALUES (note_row.id, new_review_card_id)
    ON CONFLICT (note_id) DO NOTHING;
  END LOOP;

  -- 4) Reviewed TOPIC/SOURCE notes -> practice review cards.
  FOR note_row IN
    SELECT
      src_note.*,
      tm.topic_id AS mapped_topic_id
    FROM notes src_note
    JOIN topic_note_migration_map tm ON tm.note_id = src_note.id
    LEFT JOIN review_card_note_migration_map existing_map
      ON existing_map.note_id = src_note.id
    WHERE existing_map.note_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM reviews r
        WHERE r.note_id = src_note.id
      )
      AND EXISTS (
        SELECT 1
        FROM note_tags nt
        WHERE nt.note_id = src_note.id
          AND nt.tag IN ('TOPIC', 'SOURCE')
      )
    ORDER BY src_note.inserted_at, src_note.id
  LOOP
    INSERT INTO review_cards (
      user_id,
      topic_id,
      type,
      primary_text,
      secondary_text,
      fsrs_state_id,
      archived,
      inserted_at,
      updated_at
    )
    VALUES (
      note_row.user_id,
      note_row.mapped_topic_id,
      'practice'::review_card_type,
      note_row.title,
      note_row.body,
      note_row.fsrs_state_id,
      note_row.archived,
      note_row.inserted_at,
      note_row.updated_at
    )
    RETURNING id INTO new_review_card_id;

    INSERT INTO review_card_note_migration_map (note_id, review_card_id)
    VALUES (note_row.id, new_review_card_id)
    ON CONFLICT (note_id) DO NOTHING;
  END LOOP;

  -- 5) Reviewed non-topic/non-source/non-practice notes -> flashcard cards.
  FOR note_row IN
    SELECT DISTINCT src_note.*
    FROM notes src_note
    JOIN reviews r ON r.note_id = src_note.id
    LEFT JOIN note_tags nt_topic_source
      ON nt_topic_source.note_id = src_note.id AND nt_topic_source.tag IN ('TOPIC', 'SOURCE')
    LEFT JOIN note_tags nt_practice
      ON nt_practice.note_id = src_note.id AND nt_practice.tag = 'PRACTICE'
    LEFT JOIN review_card_note_migration_map existing_map
      ON existing_map.note_id = src_note.id
    WHERE nt_topic_source.note_id IS NULL
      AND nt_practice.note_id IS NULL
      AND existing_map.note_id IS NULL
    ORDER BY src_note.inserted_at, src_note.id
  LOOP
    topic_for_card_id := NULL;

    SELECT tm.topic_id INTO topic_for_card_id
    FROM topic_note_migration_map tm
    JOIN notes parent_note ON parent_note.id = tm.note_id
    WHERE parent_note.id = note_row.parent_id;

    IF topic_for_card_id IS NULL THEN
      SELECT tm.topic_id INTO topic_for_card_id
      FROM note_relations nr
      JOIN topic_note_migration_map tm ON tm.note_id = nr.to_id
      WHERE nr.from_id = note_row.id
      ORDER BY nr.inserted_at, nr.id
      LIMIT 1;
    END IF;

    IF topic_for_card_id IS NULL THEN
      SELECT it.topic_id INTO topic_for_card_id
      FROM imported_topic_map it
      WHERE it.user_id = note_row.user_id;
    END IF;

    INSERT INTO review_cards (
      user_id,
      topic_id,
      type,
      primary_text,
      secondary_text,
      fsrs_state_id,
      archived,
      inserted_at,
      updated_at
    )
    VALUES (
      note_row.user_id,
      topic_for_card_id,
      'flashcard'::review_card_type,
      note_row.title,
      note_row.body,
      note_row.fsrs_state_id,
      note_row.archived,
      note_row.inserted_at,
      note_row.updated_at
    )
    RETURNING id INTO new_review_card_id;

    INSERT INTO review_card_note_migration_map (note_id, review_card_id)
    VALUES (note_row.id, new_review_card_id)
    ON CONFLICT (note_id) DO NOTHING;
  END LOOP;
END $$;

UPDATE reviews r
SET review_card_id = m.review_card_id
FROM review_card_note_migration_map m
WHERE r.note_id = m.note_id
  AND r.review_card_id IS NULL;

DO $$
DECLARE
  unresolved_reviews BIGINT;
BEGIN
  SELECT COUNT(*) INTO unresolved_reviews
  FROM reviews
  WHERE review_card_id IS NULL;

  IF unresolved_reviews > 0 THEN
    RAISE EXCEPTION
      'Cutover blocked: % review(s) still have NULL review_card_id',
      unresolved_reviews;
  END IF;
END $$;

-- Transitional queue/search code still relies on note_id.
-- review_card_id is now available for the new Topic + ReviewCard model.


-- Hard cutover to topics + review_cards + reviews(review_card_id).
-- Retires legacy notes tables and note-linked review references.

CREATE TABLE IF NOT EXISTS review_card_types (
  review_card_id BIGINT NOT NULL REFERENCES review_cards(id) ON DELETE CASCADE,
  type review_card_type NOT NULL,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (review_card_id, type)
);

CREATE INDEX IF NOT EXISTS idx_review_card_types_review_card ON review_card_types(review_card_id);
CREATE INDEX IF NOT EXISTS idx_review_card_types_type ON review_card_types(type);

-- Persist type projection from canonical review card type.
INSERT INTO review_card_types (review_card_id, type)
SELECT rc.id, rc.type
FROM review_cards rc
ON CONFLICT (review_card_id, type) DO NOTHING;

-- Finalize strict constraints for review entities.
ALTER TABLE review_cards
  ALTER COLUMN topic_id SET NOT NULL;

ALTER TABLE reviews
  ALTER COLUMN review_card_id SET NOT NULL;

DROP TRIGGER IF EXISTS trg_reviews_fsrs ON reviews;
DROP TRIGGER IF EXISTS trg_refresh_last_reviewed_on_completion ON reviews;
DROP FUNCTION IF EXISTS update_note_fsrs_on_review() CASCADE;
DROP FUNCTION IF EXISTS refresh_last_reviewed_on_completion() CASCADE;
DROP FUNCTION IF EXISTS recalc_last_reviewed(BIGINT, BIGINT) CASCADE;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_note_or_card_required_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_note_id_fkey;
DROP INDEX IF EXISTS idx_reviews_note_id;
ALTER TABLE reviews DROP COLUMN IF EXISTS note_id CASCADE;

-- Retire legacy notes schema.
DROP TABLE IF EXISTS note_relations CASCADE;
DROP TABLE IF EXISTS note_tags CASCADE;
DROP TABLE IF EXISTS note_migration_mappings CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
