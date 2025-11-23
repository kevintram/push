-- Rename FSRS columns in topic_reviews table to remove 'topic_' prefix

ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_stability_before" TO "stability_before";
ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_difficulty_before" TO "difficulty_before";
ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_state_before" TO "state_before";
ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_step_before" TO "step_before";
ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_due_before" TO "due_before";

ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_stability_after" TO "stability_after";
ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_difficulty_after" TO "difficulty_after";
ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_state_after" TO "state_after";
ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_step_after" TO "step_after";
ALTER TABLE "public"."topic_reviews" RENAME COLUMN "topic_due_after" TO "due_after";

