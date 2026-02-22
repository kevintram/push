-- Unified notes data model (final, squashed)
-- Creates canonical notes tables, migrates legacy entities into notes,
-- finalizes reviews.note_id as the single association, and removes legacy tables.

CREATE EXTENSION IF NOT EXISTS ltree;

DO $$
BEGIN
  CREATE TYPE note_tag AS ENUM ('TOPIC', 'SOURCE', 'PRACTICE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE reading_status AS ENUM ('NEW', 'IN_PROGRESS', 'ON_HOLD', 'FINISHED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE note_relation_type AS ENUM ('RELATED', 'PREREQUISITE', 'COVERS', 'ASSESSES');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',

  parent_id BIGINT REFERENCES notes(id) ON DELETE RESTRICT,
  path ltree,

  fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL,

  reading_status reading_status NOT NULL DEFAULT 'NEW',
  reading_notes TEXT NOT NULL DEFAULT '',
  in_reading_list BOOLEAN NOT NULL DEFAULT false,

  archived BOOLEAN NOT NULL DEFAULT false,
  inboxed BOOLEAN NOT NULL DEFAULT false,

  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag note_tag NOT NULL,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (note_id, tag)
);

CREATE TABLE IF NOT EXISTS note_relations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  to_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  relation_type note_relation_type NOT NULL,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_note_relation UNIQUE (from_id, to_id, relation_type)
);

DROP TABLE IF EXISTS note_migration_mappings;
CREATE TEMP TABLE note_migration_mappings (
  entity_type TEXT NOT NULL CHECK (entity_type IN ('topic', 'source', 'practice')),
  entity_id BIGINT NOT NULL,
  note_id BIGINT NOT NULL,
  PRIMARY KEY (entity_type, entity_id),
  UNIQUE (note_id)
) ON COMMIT DROP;

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_id);
CREATE INDEX IF NOT EXISTS idx_notes_path_gist ON notes USING GIST(path);
CREATE INDEX IF NOT EXISTS idx_notes_reading ON notes(user_id, in_reading_list, reading_status);
CREATE INDEX IF NOT EXISTS idx_notes_fsrs ON notes(fsrs_state_id);

CREATE INDEX IF NOT EXISTS idx_note_tags_tag_note ON note_tags(tag, note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_note ON note_tags(note_id);

CREATE INDEX IF NOT EXISTS idx_note_relations_from ON note_relations(from_id);
CREATE INDEX IF NOT EXISTS idx_note_relations_to ON note_relations(to_id);
CREATE INDEX IF NOT EXISTS idx_note_relations_type_from ON note_relations(relation_type, from_id);

CREATE INDEX idx_note_migration_map_note ON note_migration_mappings(note_id);

CREATE OR REPLACE FUNCTION compute_note_path(note_id BIGINT, note_parent_id BIGINT)
RETURNS ltree AS $$
DECLARE
  parent_path ltree;
BEGIN
  IF note_parent_id IS NULL THEN
    RETURN note_id::text::ltree;
  END IF;

  SELECT path INTO parent_path FROM notes WHERE id = note_parent_id;
  RETURN parent_path || note_id::text::ltree;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION maintain_note_path()
RETURNS TRIGGER AS $$
BEGIN
  NEW.path := compute_note_path(NEW.id, NEW.parent_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_note_path_insert ON notes;
CREATE TRIGGER trg_note_path_insert
  BEFORE INSERT ON notes
  FOR EACH ROW EXECUTE FUNCTION maintain_note_path();

DROP TRIGGER IF EXISTS trg_note_path_update ON notes;
CREATE TRIGGER trg_note_path_update
  BEFORE UPDATE OF parent_id ON notes
  FOR EACH ROW
  WHEN (OLD.parent_id IS DISTINCT FROM NEW.parent_id)
  EXECUTE FUNCTION maintain_note_path();

CREATE OR REPLACE FUNCTION update_note_descendant_paths()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notes
  SET path = NEW.path || subpath(path, nlevel(OLD.path))
  WHERE path <@ OLD.path AND id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_note_descendant_paths ON notes;
CREATE TRIGGER trg_note_descendant_paths
  AFTER UPDATE OF path ON notes
  FOR EACH ROW
  WHEN (OLD.path IS DISTINCT FROM NEW.path)
  EXECUTE FUNCTION update_note_descendant_paths();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_note_relations_updated_at ON note_relations;
CREATE TRIGGER update_note_relations_updated_at BEFORE UPDATE ON note_relations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION cleanup_orphaned_fsrs_states()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM fsrs_states
  WHERE id = OLD.fsrs_state_id
    AND NOT EXISTS (SELECT 1 FROM notes WHERE fsrs_state_id = OLD.fsrs_state_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_fsrs_after_note_delete ON notes;
CREATE TRIGGER cleanup_fsrs_after_note_delete
  AFTER DELETE ON notes
  FOR EACH ROW
  WHEN (OLD.fsrs_state_id IS NOT NULL)
  EXECUTE FUNCTION cleanup_orphaned_fsrs_states();

-- ---------------------------------------------------------------------------
-- Data migration
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  topic_row RECORD;
  source_row RECORD;
  practice_row RECORD;
  new_note_id BIGINT;
BEGIN
  FOR topic_row IN
    SELECT * FROM topics ORDER BY inserted_at, id
  LOOP
    INSERT INTO notes (
      user_id,
      title,
      body,
      parent_id,
      path,
      fsrs_state_id,
      reading_status,
      reading_notes,
      in_reading_list,
      archived,
      inboxed,
      inserted_at,
      updated_at
    )
    VALUES (
      topic_row.user_id,
      topic_row.name,
      topic_row.notes,
      NULL,
      NULL,
      topic_row.fsrs_state_id,
      'NEW',
      '',
      false,
      topic_row.archived,
      topic_row.inboxed,
      topic_row.inserted_at,
      topic_row.updated_at
    )
    RETURNING id INTO new_note_id;

    INSERT INTO note_tags (note_id, tag, inserted_at)
    VALUES (new_note_id, 'TOPIC', topic_row.inserted_at);

    INSERT INTO note_migration_mappings (entity_type, entity_id, note_id)
    VALUES ('topic', topic_row.id, new_note_id)
    ON CONFLICT (entity_type, entity_id) DO UPDATE
    SET note_id = EXCLUDED.note_id;
  END LOOP;

  FOR source_row IN
    SELECT * FROM sources ORDER BY inserted_at, id
  LOOP
    INSERT INTO notes (
      user_id,
      title,
      body,
      parent_id,
      path,
      fsrs_state_id,
      reading_status,
      reading_notes,
      in_reading_list,
      archived,
      inboxed,
      inserted_at,
      updated_at
    )
    VALUES (
      source_row.user_id,
      source_row.title,
      source_row.notes,
      NULL,
      NULL,
      source_row.fsrs_state_id,
      CASE source_row.status
        WHEN 'NEW' THEN 'NEW'::reading_status
        WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'::reading_status
        WHEN 'ON_HOLD' THEN 'ON_HOLD'::reading_status
        WHEN 'DROPPED' THEN 'ON_HOLD'::reading_status
        WHEN 'COMPLETED' THEN 'FINISHED'::reading_status
        WHEN 'FINISHED' THEN 'FINISHED'::reading_status
        ELSE 'NEW'::reading_status
      END,
      COALESCE(source_row.progress_note, ''),
      true,
      source_row.archived,
      source_row.inboxed,
      source_row.inserted_at,
      source_row.updated_at
    )
    RETURNING id INTO new_note_id;

    INSERT INTO note_tags (note_id, tag, inserted_at)
    VALUES (new_note_id, 'SOURCE', source_row.inserted_at);

    INSERT INTO note_migration_mappings (entity_type, entity_id, note_id)
    VALUES ('source', source_row.id, new_note_id)
    ON CONFLICT (entity_type, entity_id) DO UPDATE
    SET note_id = EXCLUDED.note_id;
  END LOOP;

  FOR practice_row IN
    SELECT * FROM practices ORDER BY inserted_at, id
  LOOP
    INSERT INTO notes (
      user_id,
      title,
      body,
      parent_id,
      path,
      fsrs_state_id,
      reading_status,
      reading_notes,
      in_reading_list,
      archived,
      inboxed,
      inserted_at,
      updated_at
    )
    VALUES (
      practice_row.user_id,
      practice_row.prompt,
      practice_row.answer,
      NULL,
      NULL,
      practice_row.fsrs_state_id,
      'NEW',
      '',
      false,
      practice_row.archived,
      practice_row.inboxed,
      practice_row.inserted_at,
      practice_row.updated_at
    )
    RETURNING id INTO new_note_id;

    INSERT INTO note_tags (note_id, tag, inserted_at)
    VALUES (new_note_id, 'PRACTICE', practice_row.inserted_at);

    INSERT INTO note_migration_mappings (entity_type, entity_id, note_id)
    VALUES ('practice', practice_row.id, new_note_id)
    ON CONFLICT (entity_type, entity_id) DO UPDATE
    SET note_id = EXCLUDED.note_id;
  END LOOP;
END $$;

-- Preserve legacy parent trees inside unified notes tree.
UPDATE notes n
SET parent_id = mapped_parent.note_id
FROM note_migration_mappings mapped_child
JOIN topics t
  ON mapped_child.entity_type = 'topic'
  AND mapped_child.entity_id = t.id
JOIN note_migration_mappings mapped_parent
  ON mapped_parent.entity_type = 'topic'
  AND mapped_parent.entity_id = t.parent_id
WHERE n.id = mapped_child.note_id
  AND t.parent_id IS NOT NULL;

UPDATE notes n
SET parent_id = mapped_parent.note_id
FROM note_migration_mappings mapped_child
JOIN sources s
  ON mapped_child.entity_type = 'source'
  AND mapped_child.entity_id = s.id
JOIN note_migration_mappings mapped_parent
  ON mapped_parent.entity_type = 'source'
  AND mapped_parent.entity_id = s.parent_id
WHERE n.id = mapped_child.note_id
  AND s.parent_id IS NOT NULL;

-- Recompute paths once parent links are in place.
UPDATE notes
SET parent_id = parent_id
WHERE parent_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Relationship migration
-- ---------------------------------------------------------------------------

INSERT INTO note_relations (from_id, to_id, relation_type, inserted_at, updated_at)
SELECT
  from_map.note_id,
  to_map.note_id,
  'RELATED',
  er.inserted_at,
  er.updated_at
FROM entity_relations er
JOIN note_migration_mappings from_map
  ON from_map.entity_type = CASE
      WHEN er.from_topic_id IS NOT NULL THEN 'topic'
      ELSE 'source'
    END
  AND from_map.entity_id = COALESCE(er.from_topic_id, er.from_source_id)
JOIN note_migration_mappings to_map
  ON to_map.entity_type = CASE
      WHEN er.to_topic_id IS NOT NULL THEN 'topic'
      ELSE 'source'
    END
  AND to_map.entity_id = COALESCE(er.to_topic_id, er.to_source_id)
ON CONFLICT (from_id, to_id, relation_type) DO NOTHING;

INSERT INTO note_relations (from_id, to_id, relation_type, inserted_at, updated_at)
SELECT
  source_map.note_id,
  prereq_map.note_id,
  'PREREQUISITE',
  sp.inserted_at,
  sp.updated_at
FROM source_prerequisites sp
JOIN note_migration_mappings source_map
  ON source_map.entity_type = 'source'
  AND source_map.entity_id = sp.source_id
JOIN note_migration_mappings prereq_map
  ON prereq_map.entity_type = CASE
      WHEN sp.prereq_topic_id IS NOT NULL THEN 'topic'
      ELSE 'source'
    END
  AND prereq_map.entity_id = COALESCE(sp.prereq_topic_id, sp.prereq_source_id)
ON CONFLICT (from_id, to_id, relation_type) DO NOTHING;

INSERT INTO note_relations (from_id, to_id, relation_type, inserted_at, updated_at)
SELECT
  source_map.note_id,
  topic_map.note_id,
  'COVERS',
  st.inserted_at,
  st.updated_at
FROM source_topics st
JOIN note_migration_mappings source_map
  ON source_map.entity_type = 'source'
  AND source_map.entity_id = st.source_id
JOIN note_migration_mappings topic_map
  ON topic_map.entity_type = 'topic'
  AND topic_map.entity_id = st.topic_id
ON CONFLICT (from_id, to_id, relation_type) DO NOTHING;

INSERT INTO note_relations (from_id, to_id, relation_type, inserted_at, updated_at)
SELECT
  practice_map.note_id,
  topic_map.note_id,
  'ASSESSES',
  pt.inserted_at,
  pt.updated_at
FROM practice_topics pt
JOIN note_migration_mappings practice_map
  ON practice_map.entity_type = 'practice'
  AND practice_map.entity_id = pt.practice_id
JOIN note_migration_mappings topic_map
  ON topic_map.entity_type = 'topic'
  AND topic_map.entity_id = pt.topic_id
ON CONFLICT (from_id, to_id, relation_type) DO NOTHING;

INSERT INTO note_relations (from_id, to_id, relation_type, inserted_at, updated_at)
SELECT
  practice_map.note_id,
  source_map.note_id,
  'ASSESSES',
  ps.inserted_at,
  ps.updated_at
FROM practice_sources ps
JOIN note_migration_mappings practice_map
  ON practice_map.entity_type = 'practice'
  AND practice_map.entity_id = ps.practice_id
JOIN note_migration_mappings source_map
  ON source_map.entity_type = 'source'
  AND source_map.entity_id = ps.source_id
ON CONFLICT (from_id, to_id, relation_type) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Reviews: add canonical note_id linkage
-- ---------------------------------------------------------------------------

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS note_id BIGINT;

UPDATE reviews r
SET note_id = map.note_id
FROM note_migration_mappings map
WHERE map.entity_type = 'topic'
  AND map.entity_id = r.topic_id
  AND r.topic_id IS NOT NULL
  AND r.note_id IS NULL;

UPDATE reviews r
SET note_id = map.note_id
FROM note_migration_mappings map
WHERE map.entity_type = 'source'
  AND map.entity_id = r.source_id
  AND r.source_id IS NOT NULL
  AND r.note_id IS NULL;

UPDATE reviews r
SET note_id = map.note_id
FROM note_migration_mappings map
WHERE map.entity_type = 'practice'
  AND map.entity_id = r.practice_id
  AND r.practice_id IS NOT NULL
  AND r.note_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_note_id_fkey'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_note_id_fkey
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_note_id ON reviews(note_id);

DROP TRIGGER IF EXISTS trg_refresh_last_reviewed_on_completion ON reviews;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_entity_type_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_topic_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_source_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_practice_id_fkey;

DROP INDEX IF EXISTS idx_reviews_topic_id;
DROP INDEX IF EXISTS idx_reviews_source_id;
DROP INDEX IF EXISTS idx_reviews_practice_id;

DELETE FROM reviews WHERE note_id IS NULL;

ALTER TABLE reviews ALTER COLUMN note_id SET NOT NULL;
ALTER TABLE reviews DROP COLUMN IF EXISTS topic_id;
ALTER TABLE reviews DROP COLUMN IF EXISTS source_id;
ALTER TABLE reviews DROP COLUMN IF EXISTS practice_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'topic_reviews_pkey'
      AND conrelid = 'reviews'::regclass
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_pkey'
      AND conrelid = 'reviews'::regclass
  ) THEN
    ALTER TABLE reviews RENAME CONSTRAINT topic_reviews_pkey TO reviews_pkey;
  END IF;
END $$;

DROP FUNCTION IF EXISTS recalc_last_reviewed(BIGINT, TEXT, BIGINT);

CREATE OR REPLACE FUNCTION recalc_last_reviewed(
  p_fsrs_state_id BIGINT,
  p_note_id BIGINT
)
RETURNS VOID AS $$
DECLARE
  v_max_completed DATE;
BEGIN
  IF p_fsrs_state_id IS NULL OR p_note_id IS NULL THEN
    RETURN;
  END IF;

  SELECT MAX(completed_at) INTO v_max_completed
  FROM reviews
  WHERE note_id = p_note_id
    AND completed_at IS NOT NULL;

  UPDATE fsrs_states
  SET last_reviewed_at = v_max_completed
  WHERE id = p_fsrs_state_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_last_reviewed_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  old_fsrs_state_id BIGINT;
  old_note_id BIGINT;
  new_fsrs_state_id BIGINT;
  new_note_id BIGINT;
BEGIN
  IF NEW.completed_at IS NOT DISTINCT FROM OLD.completed_at
    AND NEW.note_id IS NOT DISTINCT FROM OLD.note_id THEN
    RETURN NEW;
  END IF;

  old_note_id := OLD.note_id;
  new_note_id := NEW.note_id;

  IF old_note_id IS NOT NULL THEN
    SELECT fsrs_state_id INTO old_fsrs_state_id FROM notes WHERE id = old_note_id;
  END IF;

  IF new_note_id IS NOT NULL THEN
    SELECT fsrs_state_id INTO new_fsrs_state_id FROM notes WHERE id = new_note_id;
  END IF;

  IF old_fsrs_state_id IS NOT NULL THEN
    PERFORM recalc_last_reviewed(old_fsrs_state_id, old_note_id);
  END IF;

  IF new_fsrs_state_id IS NOT NULL
    AND (
      old_note_id IS DISTINCT FROM new_note_id
      OR old_fsrs_state_id IS DISTINCT FROM new_fsrs_state_id
    ) THEN
    PERFORM recalc_last_reviewed(new_fsrs_state_id, new_note_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_note_fsrs_on_review()
RETURNS TRIGGER AS $$
DECLARE
  v_fsrs_state_id BIGINT;
  v_note_id BIGINT;
  v_completed_at DATE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_note_id := OLD.note_id;
    v_completed_at := OLD.completed_at;
  ELSE
    v_note_id := NEW.note_id;
    v_completed_at := NEW.completed_at;
  END IF;

  IF v_note_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT fsrs_state_id INTO v_fsrs_state_id FROM notes WHERE id = v_note_id;

  IF v_fsrs_state_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' AND v_completed_at IS NOT NULL THEN
    PERFORM update_last_reviewed(v_fsrs_state_id, v_completed_at);
  ELSIF TG_OP = 'DELETE' AND v_completed_at IS NOT NULL THEN
    PERFORM recalc_last_reviewed(v_fsrs_state_id, v_note_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_fsrs ON reviews;
CREATE TRIGGER trg_reviews_fsrs
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_note_fsrs_on_review();

CREATE TRIGGER trg_refresh_last_reviewed_on_completion
  AFTER UPDATE OF completed_at, note_id ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_last_reviewed_on_completion();

-- ---------------------------------------------------------------------------
-- DB-level note relation tag rules
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_note_relation_tag_rules()
RETURNS trigger AS $$
BEGIN
  IF NEW.relation_type = 'COVERS' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM note_tags nt
      WHERE nt.note_id = NEW.from_id
        AND nt.tag = 'SOURCE'
    ) THEN
      RAISE EXCEPTION 'COVERS requires from_id note to have SOURCE tag'
        USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM note_tags nt
      WHERE nt.note_id = NEW.to_id
        AND nt.tag = 'TOPIC'
    ) THEN
      RAISE EXCEPTION 'COVERS requires to_id note to have TOPIC tag'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.relation_type = 'ASSESSES' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM note_tags nt
      WHERE nt.note_id = NEW.from_id
        AND nt.tag = 'PRACTICE'
    ) THEN
      RAISE EXCEPTION 'ASSESSES requires from_id note to have PRACTICE tag'
        USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM note_tags nt
      WHERE nt.note_id = NEW.to_id
        AND nt.tag IN ('TOPIC', 'SOURCE')
    ) THEN
      RAISE EXCEPTION 'ASSESSES requires to_id note to have TOPIC or SOURCE tag'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_note_relation_tag_rules ON note_relations;
CREATE TRIGGER trg_enforce_note_relation_tag_rules
  BEFORE INSERT OR UPDATE OF from_id, to_id, relation_type ON note_relations
  FOR EACH ROW
  EXECUTE FUNCTION enforce_note_relation_tag_rules();

CREATE OR REPLACE FUNCTION prevent_note_tag_removal_with_dependent_relations()
RETURNS trigger AS $$
BEGIN
  IF OLD.tag = 'SOURCE' THEN
    IF EXISTS (
      SELECT 1
      FROM note_relations nr
      WHERE nr.relation_type = 'COVERS'
        AND nr.from_id = OLD.note_id
    ) THEN
      RAISE EXCEPTION 'Cannot remove SOURCE tag while note has outgoing COVERS relations'
        USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM note_relations nr
      WHERE nr.relation_type = 'ASSESSES'
        AND nr.to_id = OLD.note_id
    ) AND NOT EXISTS (
      SELECT 1
      FROM note_tags nt
      WHERE nt.note_id = OLD.note_id
        AND nt.tag = 'TOPIC'
    ) THEN
      RAISE EXCEPTION 'Cannot remove SOURCE tag while note is assessed and lacks TOPIC tag'
        USING ERRCODE = '23514';
    END IF;
  ELSIF OLD.tag = 'TOPIC' THEN
    IF EXISTS (
      SELECT 1
      FROM note_relations nr
      WHERE nr.relation_type = 'COVERS'
        AND nr.to_id = OLD.note_id
    ) THEN
      RAISE EXCEPTION 'Cannot remove TOPIC tag while note has incoming COVERS relations'
        USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM note_relations nr
      WHERE nr.relation_type = 'ASSESSES'
        AND nr.to_id = OLD.note_id
    ) AND NOT EXISTS (
      SELECT 1
      FROM note_tags nt
      WHERE nt.note_id = OLD.note_id
        AND nt.tag = 'SOURCE'
    ) THEN
      RAISE EXCEPTION 'Cannot remove TOPIC tag while note is assessed and lacks SOURCE tag'
        USING ERRCODE = '23514';
    END IF;
  ELSIF OLD.tag = 'PRACTICE' THEN
    IF EXISTS (
      SELECT 1
      FROM note_relations nr
      WHERE nr.relation_type = 'ASSESSES'
        AND nr.from_id = OLD.note_id
    ) THEN
      RAISE EXCEPTION 'Cannot remove PRACTICE tag while note has outgoing ASSESSES relations'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_note_tag_removal_with_dependent_relations ON note_tags;
CREATE TRIGGER trg_prevent_note_tag_removal_with_dependent_relations
  BEFORE DELETE ON note_tags
  FOR EACH ROW
  EXECUTE FUNCTION prevent_note_tag_removal_with_dependent_relations();

-- ---------------------------------------------------------------------------
-- Cleanup legacy artifacts
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS legacy_note_mappings;

DO $$
DECLARE
  rel RECORD;
BEGIN
  FOR rel IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'source_prerequisites',
        'entity_relations',
        'source_topics',
        'practice_topics',
        'practice_sources',
        'topics',
        'sources',
        'practices'
      )
  LOOP
    IF rel.relkind IN ('v', 'm') THEN
      EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', rel.relname);
    ELSIF rel.relkind IN ('r', 'p') THEN
      EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', rel.relname);
    END IF;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS legacy_to_reading_status(TEXT) CASCADE;
DROP FUNCTION IF EXISTS topics_view_iud() CASCADE;
DROP FUNCTION IF EXISTS sources_view_iud() CASCADE;
DROP FUNCTION IF EXISTS practices_view_iud() CASCADE;
DROP FUNCTION IF EXISTS source_topics_view_iud() CASCADE;
DROP FUNCTION IF EXISTS practice_topics_view_iud() CASCADE;
DROP FUNCTION IF EXISTS practice_sources_view_iud() CASCADE;
DROP FUNCTION IF EXISTS source_prerequisites_view_iud() CASCADE;
DROP FUNCTION IF EXISTS entity_relations_view_iud() CASCADE;
DROP FUNCTION IF EXISTS update_entity_fsrs_on_review() CASCADE;

DROP FUNCTION IF EXISTS compute_topic_path(BIGINT, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS maintain_topic_path() CASCADE;
DROP FUNCTION IF EXISTS update_descendant_paths() CASCADE;
DROP FUNCTION IF EXISTS compute_source_path(BIGINT, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS maintain_source_path() CASCADE;
DROP FUNCTION IF EXISTS update_source_descendant_paths() CASCADE;
