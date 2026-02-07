-- Migration: Add missing FK constraint on reviews.topic_id
-- The topic_id column lost its foreign key during the association table migrations.
-- source_id and practice_id both have ON DELETE CASCADE, but topic_id does not,
-- causing reviews to be orphaned when a topic is deleted.

ALTER TABLE reviews
  ADD CONSTRAINT reviews_topic_id_fkey
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;
