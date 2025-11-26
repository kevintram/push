-- Add notes column to reviews table
-- Matching the pattern from topics.notes: Text type, nullable=False, server_default=""

alter table "public"."reviews" add column "notes" text not null default '';

