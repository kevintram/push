-- Remove review sessions entirely
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_review_session_id_fkey";
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "review_session_id";
DROP TABLE IF EXISTS "review_sessions";
