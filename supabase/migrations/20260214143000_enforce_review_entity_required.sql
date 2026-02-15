-- Enforce every review to be linked to exactly one entity.

-- Remove existing orphaned reviews first.
DELETE FROM reviews
WHERE topic_id IS NULL AND source_id IS NULL AND practice_id IS NULL;

-- Restore strict polymorphic entity check.
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_entity_type_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_entity_type_check
CHECK ((topic_id IS NOT NULL)::int + (source_id IS NOT NULL)::int + (practice_id IS NOT NULL)::int = 1);
