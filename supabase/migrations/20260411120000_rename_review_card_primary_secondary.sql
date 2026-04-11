DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'review_cards'
      AND column_name = 'prompt'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'review_cards'
      AND column_name = 'primary_text'
  ) THEN
    ALTER TABLE review_cards RENAME COLUMN prompt TO primary_text;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'review_cards'
      AND column_name = 'answer'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'review_cards'
      AND column_name = 'secondary_text'
  ) THEN
    ALTER TABLE review_cards RENAME COLUMN answer TO secondary_text;
  END IF;
END $$;
