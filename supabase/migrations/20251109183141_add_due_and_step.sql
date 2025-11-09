-- Add due date column to topics table
-- This tracks when the topic is next scheduled for review
-- Using date type (without timezone) like todos.scheduled_at and todos.completed_at
alter table "public"."topics" add column "due" date;
alter table "public"."topics" add column "step" int;