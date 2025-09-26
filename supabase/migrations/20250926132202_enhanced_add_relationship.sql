drop function if exists "public"."get_potential_children"(topic_id bigint);

drop function if exists "public"."get_potential_parents"(topic_id bigint);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_potential_children(topic_id bigint, search_query text DEFAULT NULL::text)
 RETURNS SETOF topics
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT *
    FROM topics t
    WHERE t.id NOT IN ( -- won't create a cycle
        SELECT tc.ancestor 
        FROM topics_closure tc
        WHERE tc.descendant = topic_id
    ) AND t.id NOT IN ( -- not already a child
    	SELECT tc.descendant 
    	FROM topics_closure tc
    	WHERE tc.ancestor = topic_id AND depth = 1
    ) AND (search_query IS NULL OR search_query = '' OR
    	t.name ILIKE '%' || search_query || '%' OR
    	t.notes ILIKE '%' || search_query || '%'
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_potential_parents(topic_id bigint, search_query text DEFAULT NULL::text)
 RETURNS SETOF topics
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT * 
    FROM topics t
    WHERE t.id NOT IN ( -- won't create a cycle
        SELECT tc.descendant 
        FROM topics_closure tc
        WHERE tc.ancestor = topic_id
    ) AND t.id NOT IN ( -- not already a parent
    	SELECT tc.ancestor
    	FROM topics_closure tc
    	WHERE tc.descendant = topic_id AND depth = 1
    ) AND (search_query IS NULL OR search_query = '' OR
    	t.name ILIKE '%' || search_query || '%' OR
    	t.notes ILIKE '%' || search_query || '%'
    );
END;
$function$
;


