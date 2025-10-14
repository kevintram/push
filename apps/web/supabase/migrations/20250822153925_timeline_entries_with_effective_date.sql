drop extension if exists "pg_net";

create or replace view "public"."timeline_entries_with_effective_date" as  SELECT id,
    topic_id,
    scheduled_at,
    inserted_at,
    updated_at,
    description,
    completed_at,
    COALESCE(completed_at, scheduled_at) AS effective_date
   FROM timeline_entries;



