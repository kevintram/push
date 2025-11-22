-- Rename reviews table to topic_reviews
ALTER TABLE "public"."reviews" RENAME TO "topic_reviews";

-- Rename todos table to reviews
ALTER TABLE "public"."todos" RENAME TO "reviews";

-- Rename constraints on topic_reviews (old reviews)
ALTER TABLE "public"."topic_reviews" RENAME CONSTRAINT "reviews_pkey" TO "topic_reviews_pkey";
ALTER TABLE "public"."topic_reviews" RENAME CONSTRAINT "reviews_topic_id_fkey" TO "topic_reviews_topic_id_fkey";
ALTER TABLE "public"."topic_reviews" RENAME CONSTRAINT "reviews_todo_id_topic_id_key" TO "topic_reviews_review_id_topic_id_key";

-- Rename column todo_id to review_id in topic_reviews
ALTER TABLE "public"."topic_reviews" RENAME COLUMN "todo_id" TO "review_id";

-- Rename FK constraint for review_id (was todo_id)
-- Note: The old constraint name was reviews_todo_id_fkey.
ALTER TABLE "public"."topic_reviews" RENAME CONSTRAINT "reviews_todo_id_fkey" TO "topic_reviews_review_id_fkey";

-- Rename constraints on reviews (old todos)
ALTER TABLE "public"."reviews" RENAME CONSTRAINT "todos_pkey" TO "reviews_pkey";

-- Rename trigger on reviews (old todos)
ALTER TRIGGER "update_todos_updated_at" ON "public"."reviews" RENAME TO "update_reviews_updated_at";