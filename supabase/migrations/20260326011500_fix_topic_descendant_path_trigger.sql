-- Fix descendant path maintenance for topic reparenting.
--
-- Reparent operations update `parent_id`, and a BEFORE trigger recomputes
-- `NEW.path`. The old descendant trigger listened to `AFTER UPDATE OF path`,
-- which does not fire when `path` changes only via a BEFORE trigger on a
-- `parent_id` update. That leaves descendants with stale paths.

DROP TRIGGER IF EXISTS trg_topics_descendant_paths_v2 ON topics;

CREATE TRIGGER trg_topics_descendant_paths_v2
  AFTER UPDATE ON topics
  FOR EACH ROW
  WHEN (OLD.path IS DISTINCT FROM NEW.path)
  EXECUTE FUNCTION update_topic_descendant_paths_v2();

WITH RECURSIVE topic_paths AS (
  SELECT
    id,
    id::text::ltree AS path
  FROM topics
  WHERE parent_id IS NULL

  UNION ALL

  SELECT
    child.id,
    parent.path || child.id::text::ltree
  FROM topics child
  JOIN topic_paths parent ON child.parent_id = parent.id
)
UPDATE topics
SET path = topic_paths.path
FROM topic_paths
WHERE topics.id = topic_paths.id
  AND topics.path IS DISTINCT FROM topic_paths.path;
