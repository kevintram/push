-- retrievability
alter table "public"."topics" drop column retrievability;

-- difficulty
alter table "public"."topics" add column "difficulty" real;

alter table "public"."topics" add constraint "topics_difficulty_check" CHECK (((difficulty >= (0)::numeric) AND (difficulty <= (10)::numeric))) not valid;

alter table "public"."topics" validate constraint "topics_difficulty_check";

-- stability
alter table "public"."topics" alter column "stability" type real using stability::real;

alter table "public"."topics" add constraint "topics_stability_check" CHECK ((stability > (0)::numeric)) not valid;

alter table "public"."topics" validate constraint "topics_stability_check";

-- state
create type "public"."learning_state" as enum ('LEARNING', 'REVIEW', 'RELEARNING');

alter table "public"."topics" add column "state" learning_state default 'LEARNING'::learning_state;

-- todos_topics -> reviews
alter table "public"."todos_topics" rename to "reviews";

alter table "public"."reviews"
rename constraint "todos_topics_pkey" to "reviews_pkey";

alter table "public"."reviews"
rename constraint "todos_topics_todo_id_fkey" to "reviews_todo_id_fkey";

alter table "public"."reviews"
rename constraint "todos_topics_topic_id_fkey" to "reviews_topic_id_fkey";

-- reviews.rating
create type "public"."rating" as enum ('miss', 'hard', 'good', 'easy');

alter table "public"."reviews"
add column "rating" "rating";

update "public"."reviews" set "rating" = 'good';

alter table "public"."reviews"
alter column "rating" set not null;