-- Add srs_enabled column to topics table
-- When false, the topic will not appear in Today, Upcoming, or Unscheduled pages
ALTER TABLE topics ADD COLUMN srs_enabled BOOLEAN NOT NULL DEFAULT true;

