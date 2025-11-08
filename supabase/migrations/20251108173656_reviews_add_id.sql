-- Add id column to reviews table as primary key
-- Add user_id for direct ownership
-- Keep composite unique constraint on (todo_id, topic_id)

-- Drop the existing composite primary key
alter table "public"."reviews" drop constraint "reviews_pkey";

-- Add id column with identity
alter table "public"."reviews" add column "id" bigint generated always as identity primary key;

-- Add user_id column and populate from todos.user_id
alter table "public"."reviews" add column "user_id" text;

update "public"."reviews" r
set "user_id" = t.user_id
from "public"."todos" t
where r.todo_id = t.id;

alter table "public"."reviews" alter column "user_id" set not null;

-- Add unique constraint on (todo_id, topic_id) to maintain one review per todo-topic pair
alter table "public"."reviews" add constraint "reviews_todo_id_topic_id_key" unique ("todo_id", "topic_id");
