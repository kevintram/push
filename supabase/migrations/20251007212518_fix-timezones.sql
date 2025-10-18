drop view if exists "public"."todos_with_effective_date";

alter table "public"."todos" alter column "scheduled_at" set data type date using (date_trunc('day', "scheduled_at" at time zone 'utc')::date);

alter table "public"."todos" alter column "completed_at" set data type date using (date_trunc('day', "completed_at" at time zone 'utc')::date);

create or replace view "public"."todos_with_effective_date" as  SELECT id,
    scheduled_at,
    inserted_at,
    updated_at,
    description,
    completed_at,
    COALESCE(completed_at, scheduled_at) AS effective_date
   FROM todos;