-- Add inherited fields for FSRS state inheritance
-- These fields capture the parent's FSRS state when a child topic inherits

ALTER TABLE topics ADD COLUMN inherited_stability REAL;
ALTER TABLE topics ADD COLUMN inherited_difficulty REAL;
ALTER TABLE topics ADD COLUMN inherited_state TEXT;
ALTER TABLE topics ADD COLUMN inherited_last_review DATE;
