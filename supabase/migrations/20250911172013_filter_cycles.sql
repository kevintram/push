set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_potential_children(topic_id bigint)
 RETURNS TABLE(id bigint, name text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name 
    FROM topics t
    WHERE t.id NOT IN (
        SELECT tc.ancestor 
        FROM topics_closure tc
        WHERE tc.descendant = topic_id
    ) AND t.id NOT IN (
    	SELECT tc.descendant
    	FROM topics_closure tc
    	WHERE tc.ancestor = topic_id
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_potential_parents(topic_id bigint)
 RETURNS TABLE(id bigint, name text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name 
    FROM topics t
    WHERE t.id NOT IN ( -- won't create a cycle
        SELECT tc.descendant 
        FROM topics_closure tc
        WHERE tc.ancestor = topic_id
    ) AND t.id NOT IN ( -- not already an ancestor
    	SELECT tc.ancestor
    	FROM topics_closure tc
    	WHERE tc.descendant = topic_id
    );
END;
$function$
;


