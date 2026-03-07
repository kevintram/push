ALTER TABLE review_cards
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_review_cards_pinned_at
  ON review_cards (pinned_at DESC)
  WHERE pinned_at IS NOT NULL;
