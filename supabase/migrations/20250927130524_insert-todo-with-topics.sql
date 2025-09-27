set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_todo_with_topics(p_todo_scheduled_at timestamp with time zone, p_todo_completed_at timestamp with time zone, p_topic_ids bigint[], p_todo_description text DEFAULT ''::text)
 RETURNS TABLE(todo_id bigint, todo_description text, todo_scheduled_at timestamp with time zone, todo_completed_at timestamp with time zone, topic_ids bigint[])
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_todo_id bigint;
BEGIN
    INSERT INTO todos(description, scheduled_at, completed_at)
    VALUES (p_todo_description, p_todo_scheduled_at, p_todo_completed_at)
    RETURNING id INTO v_todo_id;

    -- Early exit if no topics
    IF p_topic_ids IS NULL OR cardinality(p_topic_ids) = 0 THEN
        RETURN QUERY
        SELECT v_todo_id, p_todo_description, p_todo_scheduled_at, p_todo_completed_at, p_topic_ids;
        RETURN;
    END IF;

    -- Validate topic_ids exist
    IF EXISTS (
        SELECT 1 FROM unnest(p_topic_ids) AS t(id)
        WHERE NOT EXISTS (SELECT 1 FROM topics WHERE topics.id = t.id)
    ) THEN
        RAISE EXCEPTION 'One or more topic_ids do not exist';
    END IF;

    INSERT INTO todos_topics(todo_id, topic_id)
    SELECT v_todo_id, t.id FROM unnest(p_topic_ids) as t(id);

    RETURN QUERY SELECT v_todo_id, p_todo_description, p_todo_scheduled_at, p_todo_completed_at, p_topic_ids;
EXCEPTION
    WHEN OTHERS THEN
        RAISE; -- Re-raise the exception
END;
$function$
;


