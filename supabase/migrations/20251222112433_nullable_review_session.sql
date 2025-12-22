-- Make review_session_id nullable on reviews table
-- This allows reviews to exist without being part of a session

ALTER TABLE "public"."reviews" ALTER COLUMN "review_session_id" DROP NOT NULL;
