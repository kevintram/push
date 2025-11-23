alter table "public"."topics" drop constraint "topics_difficulty_check";

alter table "public"."topics" drop constraint "topics_stability_check";

alter table "public"."topic_reviews" alter column "rating" drop default;

alter table "public"."topics" alter column "state" drop default;

alter table "public"."topic_reviews" alter column rating type "public"."rating" using rating::text::"public"."rating";

alter table "public"."topics" alter column state type "public"."learning_state" using state::text::"public"."learning_state";

alter table "public"."topic_reviews" alter column "rating" set default null;

alter table "public"."topics" alter column "state" set default 'LEARNING'::public.learning_state;

alter table "public"."topic_reviews" alter column "rating" set default 'good'::public.rating;

alter table "public"."topics" alter column "difficulty" set data type numeric using "difficulty"::numeric;

alter table "public"."topics" alter column "stability" drop default;

alter table "public"."topics" alter column "stability" drop not null;

alter table "public"."topics" alter column "stability" set data type numeric using "stability"::numeric;

alter table "public"."topics" alter column "state" set default 'REVIEW'::public.learning_state;

alter table "public"."topics" add constraint "topics_difficulty_check" CHECK (((difficulty >= (0)::numeric) AND (difficulty <= (10)::numeric))) not valid;

alter table "public"."topics" validate constraint "topics_difficulty_check";

alter table "public"."topics" add constraint "topics_stability_check" CHECK ((stability > (0)::numeric)) NOT VALID not valid;

alter table "public"."topics" validate constraint "topics_stability_check";


