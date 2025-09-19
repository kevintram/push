drop trigger if exists "update_practice_cards_updated_at" on "public"."practice_cards";

revoke delete on table "public"."practice_cards" from "anon";

revoke insert on table "public"."practice_cards" from "anon";

revoke references on table "public"."practice_cards" from "anon";

revoke select on table "public"."practice_cards" from "anon";

revoke trigger on table "public"."practice_cards" from "anon";

revoke truncate on table "public"."practice_cards" from "anon";

revoke update on table "public"."practice_cards" from "anon";

revoke delete on table "public"."practice_cards" from "authenticated";

revoke insert on table "public"."practice_cards" from "authenticated";

revoke references on table "public"."practice_cards" from "authenticated";

revoke select on table "public"."practice_cards" from "authenticated";

revoke trigger on table "public"."practice_cards" from "authenticated";

revoke truncate on table "public"."practice_cards" from "authenticated";

revoke update on table "public"."practice_cards" from "authenticated";

revoke delete on table "public"."practice_cards" from "service_role";

revoke insert on table "public"."practice_cards" from "service_role";

revoke references on table "public"."practice_cards" from "service_role";

revoke select on table "public"."practice_cards" from "service_role";

revoke trigger on table "public"."practice_cards" from "service_role";

revoke truncate on table "public"."practice_cards" from "service_role";

revoke update on table "public"."practice_cards" from "service_role";

revoke delete on table "public"."timeline_entry_practice_cards" from "anon";

revoke insert on table "public"."timeline_entry_practice_cards" from "anon";

revoke references on table "public"."timeline_entry_practice_cards" from "anon";

revoke select on table "public"."timeline_entry_practice_cards" from "anon";

revoke trigger on table "public"."timeline_entry_practice_cards" from "anon";

revoke truncate on table "public"."timeline_entry_practice_cards" from "anon";

revoke update on table "public"."timeline_entry_practice_cards" from "anon";

revoke delete on table "public"."timeline_entry_practice_cards" from "authenticated";

revoke insert on table "public"."timeline_entry_practice_cards" from "authenticated";

revoke references on table "public"."timeline_entry_practice_cards" from "authenticated";

revoke select on table "public"."timeline_entry_practice_cards" from "authenticated";

revoke trigger on table "public"."timeline_entry_practice_cards" from "authenticated";

revoke truncate on table "public"."timeline_entry_practice_cards" from "authenticated";

revoke update on table "public"."timeline_entry_practice_cards" from "authenticated";

revoke delete on table "public"."timeline_entry_practice_cards" from "service_role";

revoke insert on table "public"."timeline_entry_practice_cards" from "service_role";

revoke references on table "public"."timeline_entry_practice_cards" from "service_role";

revoke select on table "public"."timeline_entry_practice_cards" from "service_role";

revoke trigger on table "public"."timeline_entry_practice_cards" from "service_role";

revoke truncate on table "public"."timeline_entry_practice_cards" from "service_role";

revoke update on table "public"."timeline_entry_practice_cards" from "service_role";

alter table "public"."practice_cards" drop constraint "practice_cards_topic_id_fkey";

alter table "public"."timeline_entry_practice_cards" drop constraint "timeline_entry_practice_cards_practice_card_id_fkey";

alter table "public"."timeline_entry_practice_cards" drop constraint "timeline_entry_practice_cards_timeline_entry_id_fkey";

alter table "public"."timeline_entry_practice_cards" drop constraint "unique_session_card";

alter table "public"."practice_cards" drop constraint "practice_cards_pkey";

alter table "public"."timeline_entry_practice_cards" drop constraint "timeline_entry_practice_cards_pkey";

drop index if exists "public"."practice_cards_pkey";

drop index if exists "public"."timeline_entry_practice_cards_pkey";

drop index if exists "public"."unique_session_card";

drop table "public"."practice_cards";

drop table "public"."timeline_entry_practice_cards";

update "public"."topics" set "notes" = '' where "notes" is null;	 

alter table "public"."topics" alter column "notes" set default ''::text;

alter table "public"."topics" alter column "notes" set not null;


