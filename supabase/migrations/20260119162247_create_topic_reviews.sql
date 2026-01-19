-- Phase 1 Migration 4: Create topic_reviews association table
-- This prepares for polymorphic reviews (topic/source/practice) by using association tables

-- Create topic_reviews association table
CREATE TABLE topic_reviews (
  review_id BIGINT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE
);

-- Populate from existing reviews
INSERT INTO topic_reviews (review_id, topic_id)
SELECT id, topic_id FROM reviews WHERE topic_id IS NOT NULL;

-- Index for lookups
CREATE INDEX idx_topic_reviews_topic ON topic_reviews(topic_id);

-- Make reviews.topic_id nullable (association table now handles this)
ALTER TABLE reviews ALTER COLUMN topic_id DROP NOT NULL;

-- Cascade delete trigger: when topic_reviews row deleted, delete the review
CREATE OR REPLACE FUNCTION cascade_review_delete_on_topic_reviews()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM reviews WHERE id = OLD.review_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_review_delete_topic
  AFTER DELETE ON topic_reviews
  FOR EACH ROW EXECUTE FUNCTION cascade_review_delete_on_topic_reviews();
