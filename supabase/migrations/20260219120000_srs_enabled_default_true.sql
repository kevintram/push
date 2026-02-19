-- Change srs_enabled default from false to true on fsrs_states table
ALTER TABLE fsrs_states ALTER COLUMN srs_enabled SET DEFAULT true;
