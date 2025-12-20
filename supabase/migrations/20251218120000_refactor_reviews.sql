-- Rename tables
ALTER TABLE "reviews" RENAME TO "review_sessions";
ALTER TABLE "topic_reviews" RENAME TO "reviews";

-- Rename foreign key column in new reviews table (was topic_reviews)
ALTER TABLE "reviews" RENAME COLUMN "review_id" TO "review_session_id";

-- Add new columns to new reviews table
ALTER TABLE "reviews" ADD COLUMN "completed_at" date;
ALTER TABLE "reviews" ADD COLUMN "scheduled_at" date;
ALTER TABLE "reviews" ADD COLUMN "description" text DEFAULT '' NOT NULL;
