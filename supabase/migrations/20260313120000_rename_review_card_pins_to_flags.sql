ALTER TABLE review_cards
  RENAME COLUMN pinned_at TO flagged_at;

ALTER INDEX IF EXISTS idx_review_cards_pinned_at
  RENAME TO idx_review_cards_flagged_at;
