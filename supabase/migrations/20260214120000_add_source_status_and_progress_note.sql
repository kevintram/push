-- Add lifecycle status and progress note to sources.

ALTER TABLE sources
ADD COLUMN status TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN progress_note TEXT NOT NULL DEFAULT '';

ALTER TABLE sources
ADD CONSTRAINT sources_status_check
CHECK (status IN ('NEW', 'IN_PROGRESS', 'ON_HOLD', 'DROPPED', 'COMPLETED'));
