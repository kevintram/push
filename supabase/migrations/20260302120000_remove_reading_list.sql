DROP INDEX IF EXISTS idx_notes_reading;

ALTER TABLE notes DROP COLUMN IF EXISTS in_reading_list;
ALTER TABLE notes DROP COLUMN IF EXISTS reading_notes;
ALTER TABLE notes DROP COLUMN IF EXISTS reading_status;

DROP TYPE IF EXISTS reading_status;
