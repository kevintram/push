ALTER TABLE public.topics
DROP CONSTRAINT IF EXISTS topics_parent_id_fkey;

ALTER TABLE public.topics
ADD CONSTRAINT topics_parent_id_fkey
FOREIGN KEY (parent_id)
REFERENCES public.topics(id)
ON DELETE CASCADE;
