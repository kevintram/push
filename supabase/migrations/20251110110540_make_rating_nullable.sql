-- Make rating column nullable with default 'good'
-- Rating should be null for incomplete todos (planned reviews) and default to 'good' for completed todos
alter table "public"."reviews" alter column "rating" drop not null;