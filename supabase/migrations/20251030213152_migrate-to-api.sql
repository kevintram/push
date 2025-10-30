drop function if exists "public"."get_potential_children"(topic_id bigint, search_query text);

drop function if exists "public"."get_potential_parents"(topic_id bigint, search_query text);

drop function if exists "public"."insert_todo_with_topics"(p_todo_scheduled_at timestamp with time zone, p_todo_completed_at timestamp with time zone, p_topic_ids bigint[], p_todo_description text);

drop view if exists "public"."todos_with_effective_date";

alter table "public"."todos" add column "user_id" text;
update "public"."todos" set "user_id" = '';
alter table "public"."todos" alter column "user_id" set not null;

alter table "public"."topics" add column "user_id" text;
update "public"."topics" set "user_id" = '';
alter table "public"."topics" alter column "user_id" set not null;
