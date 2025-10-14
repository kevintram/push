alter table "public"."timeline_entries" alter column "scheduled_at" drop default;

alter table "public"."timeline_entries" alter column "scheduled_at" drop not null;


