-- Add notes column to reviews table

ALTER TABLE "public"."reviews" ADD COLUMN "notes" text NOT NULL DEFAULT '';
