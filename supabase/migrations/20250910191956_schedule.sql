create or replace view "public"."timeline_entries_today" as  SELECT id,
    topic_id,
    scheduled_at,
    inserted_at,
    updated_at,
    description,
    completed_at,
    COALESCE(completed_at, scheduled_at) AS effective_date
   FROM timeline_entries
  WHERE (((scheduled_at)::date = CURRENT_DATE) OR ((completed_at)::date = CURRENT_DATE) OR (((scheduled_at)::date < CURRENT_DATE) AND (completed_at IS NULL)));