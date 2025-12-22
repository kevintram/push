-- Replace due date with last_reviewed_at for retrievability calculation
-- Retrievability is calculated as: (1 + FACTOR * elapsed_days / stability) ^ DECAY
-- where elapsed_days = days since last_reviewed_at

-- 1. Add last_reviewed_at column to topics table
ALTER TABLE "public"."topics" ADD COLUMN "last_reviewed_at" date;

-- 2. Backfill last_reviewed_at from reviews table (most recent completed review)
UPDATE "public"."topics" t
SET last_reviewed_at = (
    SELECT MAX(r.completed_at)
    FROM "public"."reviews" r
    WHERE r.topic_id = t.id AND r.completed_at IS NOT NULL
);

-- 3. Create trigger function to keep last_reviewed_at in sync with reviews
CREATE OR REPLACE FUNCTION update_topic_last_reviewed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.completed_at IS NOT NULL THEN
        -- New completed review: update if this is more recent
        UPDATE "public"."topics"
        SET last_reviewed_at = GREATEST(COALESCE(last_reviewed_at, NEW.completed_at), NEW.completed_at)
        WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
        -- Review completion changed: recalculate from all reviews
        UPDATE "public"."topics"
        SET last_reviewed_at = (
            SELECT MAX(completed_at)
            FROM "public"."reviews"
            WHERE topic_id = NEW.topic_id AND completed_at IS NOT NULL
        )
        WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'DELETE' AND OLD.completed_at IS NOT NULL THEN
        -- Completed review deleted: recalculate from remaining reviews
        UPDATE "public"."topics"
        SET last_reviewed_at = (
            SELECT MAX(completed_at)
            FROM "public"."reviews"
            WHERE topic_id = OLD.topic_id AND completed_at IS NOT NULL
        )
        WHERE id = OLD.topic_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on reviews table
CREATE TRIGGER trg_update_topic_last_reviewed_at
AFTER INSERT OR UPDATE OR DELETE ON "public"."reviews"
FOR EACH ROW EXECUTE FUNCTION update_topic_last_reviewed_at();

-- 5. Drop the due column from topics (no longer needed with retrievability)
ALTER TABLE "public"."topics" DROP COLUMN "due";
