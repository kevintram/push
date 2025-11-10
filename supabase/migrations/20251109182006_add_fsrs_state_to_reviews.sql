-- Add FSRS state tracking columns to reviews table
-- These columns store the before/after state of topics for proper undo/recalculation

-- Topic state before review (nullable - will be null for first review of a topic)
alter table "public"."reviews" add column "topic_stability_before" real;
alter table "public"."reviews" add column "topic_difficulty_before" real;
alter table "public"."reviews" add column "topic_state_before" learning_state;
alter table "public"."reviews" add column "topic_step_before" int;

-- Topic state after review (not null for new reviews - existing reviews will have nulls)
alter table "public"."reviews" add column "topic_stability_after" real;
alter table "public"."reviews" add column "topic_difficulty_after" real;
alter table "public"."reviews" add column "topic_state_after" learning_state;
alter table "public"."reviews" add column "topic_step_after" int;
alter table "public"."reviews" add column "topic_due_after" date;
