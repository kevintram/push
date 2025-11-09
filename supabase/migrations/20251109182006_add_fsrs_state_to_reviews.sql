-- Add FSRS state tracking columns to reviews table
-- These columns store the before/after state of topics for proper undo/recalculation

-- Before state (nullable - will be null for first review of a topic)
alter table "public"."reviews" add column "stability_before" real;
alter table "public"."reviews" add column "difficulty_before" real;
alter table "public"."reviews" add column "state_before" learning_state;
alter table "public"."reviews" add column "step_before" int;

-- After state (not null for new reviews - existing reviews will have nulls)
alter table "public"."reviews" add column "stability_after" real;
alter table "public"."reviews" add column "difficulty_after" real;
alter table "public"."reviews" add column "state_after" learning_state;
alter table "public"."reviews" add column "step_after" int;
alter table "public"."reviews" add column "due_after" date;
