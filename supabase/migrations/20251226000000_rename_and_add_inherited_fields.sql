-- Rename initial_stability to inherited_stability and add other inherited fields
-- These fields capture the parent's FSRS state when a child topic inherits

ALTER TABLE topics RENAME COLUMN initial_stability TO inherited_stability;
ALTER TABLE topics ADD COLUMN inherited_difficulty REAL;
ALTER TABLE topics ADD COLUMN inherited_state TEXT;
ALTER TABLE topics ADD COLUMN inherited_last_review DATE;
