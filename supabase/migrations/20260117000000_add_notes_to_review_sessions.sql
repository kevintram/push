-- Add notes column to review_sessions table (was missing from schema)
ALTER TABLE "public"."review_sessions" ADD COLUMN "notes" text NOT NULL DEFAULT '';
