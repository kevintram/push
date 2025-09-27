alter table "public"."todos" drop constraint "timeline_entries_topic_id_fkey";

drop view if exists "public"."todos_today";

create table "public"."todos_topics" (
    "inserted_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    topic_id bigint not null references topics(id) on delete cascade,
	todo_id bigint not null references todos(id) on delete cascade,
    primary key (topic_id, todo_id)
);

insert into todos_topics (topic_id, todo_id)
select topic_id, id as todo_id 
from todos;

alter table "public"."todos" drop column "topic_id" cascade;

alter table "public"."todos_topics" validate constraint "todos_topics_todo_id_fkey";

alter table "public"."todos_topics" validate constraint "todos_topics_topic_id_fkey";

create or replace view "public"."todos_with_effective_date" as  SELECT id,
    scheduled_at,
    inserted_at,
    updated_at,
    description,
    completed_at,
    COALESCE(completed_at, scheduled_at) AS effective_date
   FROM todos;


grant delete on table "public"."todos_topics" to "anon";

grant insert on table "public"."todos_topics" to "anon";

grant references on table "public"."todos_topics" to "anon";

grant select on table "public"."todos_topics" to "anon";

grant trigger on table "public"."todos_topics" to "anon";

grant truncate on table "public"."todos_topics" to "anon";

grant update on table "public"."todos_topics" to "anon";

grant delete on table "public"."todos_topics" to "authenticated";

grant insert on table "public"."todos_topics" to "authenticated";

grant references on table "public"."todos_topics" to "authenticated";

grant select on table "public"."todos_topics" to "authenticated";

grant trigger on table "public"."todos_topics" to "authenticated";

grant truncate on table "public"."todos_topics" to "authenticated";

grant update on table "public"."todos_topics" to "authenticated";

grant delete on table "public"."todos_topics" to "service_role";

grant insert on table "public"."todos_topics" to "service_role";

grant references on table "public"."todos_topics" to "service_role";

grant select on table "public"."todos_topics" to "service_role";

grant trigger on table "public"."todos_topics" to "service_role";

grant truncate on table "public"."todos_topics" to "service_role";

grant update on table "public"."todos_topics" to "service_role";


