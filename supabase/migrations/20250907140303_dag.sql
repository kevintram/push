create table "public"."topics_closure" (
    "ancestor" bigint not null,
    "descendant" bigint not null,
    "depth" integer not null default 0,
    "count" integer not null default 1,
    "inserted_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


CREATE UNIQUE INDEX topics_closure_pkey ON public.topics_closure USING btree (ancestor, descendant, depth);

alter table "public"."topics_closure" add constraint "topics_closure_pkey" PRIMARY KEY using index "topics_closure_pkey";

alter table "public"."topics_closure" add constraint "max_paths" CHECK (((count <= depth) OR (depth = 0))) not valid;

alter table "public"."topics_closure" validate constraint "max_paths";

alter table "public"."topics_closure" add constraint "topics_closure_ancestor_fkey" FOREIGN KEY (ancestor) REFERENCES topics(id) ON DELETE CASCADE not valid;

alter table "public"."topics_closure" validate constraint "topics_closure_ancestor_fkey";

alter table "public"."topics_closure" add constraint "topics_closure_descendant_fkey" FOREIGN KEY (descendant) REFERENCES topics(id) ON DELETE CASCADE not valid;

alter table "public"."topics_closure" validate constraint "topics_closure_descendant_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_relationship(parent integer, child integer)
 RETURNS void
 LANGUAGE sql
AS $function$
WITH selected_edges AS (
	SELECT l.ancestor as ancestor, r.descendant as descendant, l.depth + r.depth + (CASE WHEN parent = child THEN 0 ELSE 1 END) as depth FROM (
		(SELECT * FROM topics_closure WHERE descendant = parent) l
		CROSS JOIN
		(SELECT * FROM topics_closure WHERE ancestor = child) r
	)
), updated AS (
	UPDATE topics_closure SET count = count - 1
	WHERE (ancestor, descendant, depth) IN (
		SELECT ancestor, descendant, depth FROM selected_edges
	) AND count > 1
) 
DELETE FROM topics_closure WHERE (ancestor, descendant, depth) IN (SELECT ancestor, descendant, depth FROM selected_edges) AND count = 1;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_relationship(parent integer, child integer)
 RETURNS topics_closure
 LANGUAGE sql
AS $function$
WITH cycle_check AS (
	SELECT * FROM topics_closure WHERE descendant = parent AND ancestor = child -- there will be a cycle if there's already an edge in G^* where child is an ancestor of parent

), cross_inserts AS (
	SELECT parent_ancestors.ancestor as ancestor, child_descendents.descendant as descendant, (parent_ancestors.depth + child_descendents.depth + 1) as depth FROM (
		(
			SELECT * FROM topics_closure WHERE descendant = parent
			AND NOT EXISTS (SELECT * FROM cycle_check)
		) parent_ancestors
		CROSS JOIN
		(
			SELECT * FROM topics_closure WHERE ancestor = child
			AND NOT EXISTS (SELECT * FROM cycle_check)
		) child_descendents
	)
) INSERT INTO topics_closure (ancestor, descendant, depth)
	SELECT ancestor, descendant, depth FROM cross_inserts
	ON CONFLICT ON CONSTRAINT topics_closure_pkey
	DO UPDATE SET count = EXCLUDED.count + 1
	RETURNING *
$function$
;

CREATE OR REPLACE FUNCTION public.insert_topic_reflexive_path()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
	INSERT INTO topics_closure (ancestor, descendant)
	VALUES (NEW.id, NEW.id);
	RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_topic_reflexive_path(topicid integer)
 RETURNS topics_closure
 LANGUAGE plpgsql
AS $function$
DECLARE
	inserted_reflexive_path topics_closure;
BEGIN
	INSERT INTO topics_closure (ancestor, descendant)
	VALUES (topicId, topicId)
	RETURNING * INTO inserted_reflexive_path;
	return inserted_reflexive_path;
END;
$function$
;

grant delete on table "public"."topics_closure" to "anon";

grant insert on table "public"."topics_closure" to "anon";

grant references on table "public"."topics_closure" to "anon";

grant select on table "public"."topics_closure" to "anon";

grant trigger on table "public"."topics_closure" to "anon";

grant truncate on table "public"."topics_closure" to "anon";

grant update on table "public"."topics_closure" to "anon";

grant delete on table "public"."topics_closure" to "authenticated";

grant insert on table "public"."topics_closure" to "authenticated";

grant references on table "public"."topics_closure" to "authenticated";

grant select on table "public"."topics_closure" to "authenticated";

grant trigger on table "public"."topics_closure" to "authenticated";

grant truncate on table "public"."topics_closure" to "authenticated";

grant update on table "public"."topics_closure" to "authenticated";

grant delete on table "public"."topics_closure" to "service_role";

grant insert on table "public"."topics_closure" to "service_role";

grant references on table "public"."topics_closure" to "service_role";

grant select on table "public"."topics_closure" to "service_role";

grant trigger on table "public"."topics_closure" to "service_role";

grant truncate on table "public"."topics_closure" to "service_role";

grant update on table "public"."topics_closure" to "service_role";

CREATE TRIGGER insert_topic_reflexive_path_closure AFTER INSERT ON public.topics FOR EACH ROW EXECUTE FUNCTION insert_topic_reflexive_path();

CREATE TRIGGER update_topics_closure_updated_at BEFORE UPDATE ON public.topics_closure FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


