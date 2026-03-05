DROP INDEX IF EXISTS idx_topics_archived;
DROP INDEX IF EXISTS idx_review_cards_archived;

ALTER TABLE public.topics
DROP COLUMN IF EXISTS archived;

ALTER TABLE public.review_cards
DROP COLUMN IF EXISTS archived;
