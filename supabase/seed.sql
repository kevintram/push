-- Compact but representative seed data for Topics + Review Cards.
-- IMPORTANT: seed only the real WorkOS test user used by E2E.

BEGIN;

TRUNCATE TABLE review_card_types, reviews, review_cards, topics, fsrs_states
RESTART IDENTITY CASCADE;

-- Real WorkOS test user id (workostest@protonmail.com)
WITH topic_seed (id, title, body, parent_id, created_days_ago, updated_days_ago) AS (
  VALUES
    (1, 'Learning Hub', 'Root topic for active study.', NULL, 90, 2),
    (2, 'Mathematics', 'Math tracks and practice.', 1, 85, 3),
    (3, 'Computer Science', 'Systems and algorithms.', 1, 82, 1),
    (4, 'Flashcards Decks', 'Recall-first study cards.', 1, 80, 1),
    (5, 'Algebra', 'Equations and symbolic manipulation.', 2, 75, 2),
    (6, 'Distributed Systems', 'Replication and consensus.', 3, 72, 4),
    (7, 'Interview Prep', 'High-frequency prep material.', 3, 70, 2),
    (8, 'Legacy Topics', 'Retired learning paths.', 1, 65, 20)
)
INSERT INTO topics (id, user_id, title, body, parent_id, inserted_at, updated_at)
OVERRIDING SYSTEM VALUE
SELECT
  id,
  'user_01KGG4R8HZAV513662YE3DJ0A9',
  title,
  body,
  parent_id,
  timezone('utc'::text, now()) - (created_days_ago || ' days')::interval,
  timezone('utc'::text, now()) - (updated_days_ago || ' days')::interval
FROM topic_seed
ORDER BY id;

-- FSRS states: 1-8 active reviewed cards, 9-12 mostly new cards.
INSERT INTO fsrs_states (
  id,
  stability,
  difficulty,
  state,
  step,
  last_reviewed_at,
  srs_enabled,
  inserted_at,
  updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
  n,
  CASE WHEN n >= 9 THEN NULL ELSE (2.0 + (n * 0.4))::real END,
  CASE WHEN n >= 9 THEN NULL ELSE (2.2 + (n * 0.25))::real END,
  CASE
    WHEN n >= 9 THEN 'LEARNING'::learning_state
    WHEN n % 4 = 0 THEN 'RELEARNING'::learning_state
    ELSE 'REVIEW'::learning_state
  END,
  CASE
    WHEN n >= 9 THEN 0
    WHEN n % 4 = 0 THEN 1
    ELSE NULL
  END,
  CASE WHEN n >= 9 THEN NULL ELSE CURRENT_DATE - ((n % 7) + 1) END,
  true,
  timezone('utc'::text, now()) - ((40 - n) || ' days')::interval,
  timezone('utc'::text, now()) - ((n % 5) || ' days')::interval
FROM generate_series(1, 12) AS n;

INSERT INTO review_cards (
  id,
  user_id,
  topic_id,
  type,
  prompt,
  answer,
  fsrs_state_id,
  inserted_at,
  updated_at
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'user_01KGG4R8HZAV513662YE3DJ0A9', 5, 'practice', 'Solve linear equation quickly', 'Isolate variable, simplify both sides, check solution.', 1, timezone('utc'::text, now()) - interval '30 days', timezone('utc'::text, now()) - interval '2 days'),
  (2, 'user_01KGG4R8HZAV513662YE3DJ0A9', 5, 'practice', 'Factor quadratic reliably', 'Split middle term and group factors.', 2, timezone('utc'::text, now()) - interval '28 days', timezone('utc'::text, now()) - interval '1 days'),
  (3, 'user_01KGG4R8HZAV513662YE3DJ0A9', 6, 'practice', 'Explain quorum writes', 'Writes commit when quorum acknowledges to guarantee overlap.', 3, timezone('utc'::text, now()) - interval '25 days', timezone('utc'::text, now()) - interval '1 days'),
  (4, 'user_01KGG4R8HZAV513662YE3DJ0A9', 7, 'practice', 'Two-sum interview drill', 'Hash-map lookup for complement in O(n).', 4, timezone('utc'::text, now()) - interval '22 days', timezone('utc'::text, now()) - interval '3 days'),
  (5, 'user_01KGG4R8HZAV513662YE3DJ0A9', 4, 'flashcard', 'CAP theorem in one line', 'In partition, choose consistency or availability.', 5, timezone('utc'::text, now()) - interval '20 days', timezone('utc'::text, now()) - interval '2 days'),
  (6, 'user_01KGG4R8HZAV513662YE3DJ0A9', 4, 'flashcard', 'Big-O of binary search', 'O(log n)', 6, timezone('utc'::text, now()) - interval '18 days', timezone('utc'::text, now()) - interval '1 days'),
  (7, 'user_01KGG4R8HZAV513662YE3DJ0A9', 4, 'flashcard', 'When to use consistent hashing', 'When nodes join/leave and key movement should be minimized.', 7, timezone('utc'::text, now()) - interval '16 days', timezone('utc'::text, now()) - interval '1 days'),
  (8, 'user_01KGG4R8HZAV513662YE3DJ0A9', 7, 'flashcard', 'Tell me your strongest project story', 'Use STAR and quantify impact.', 8, timezone('utc'::text, now()) - interval '14 days', timezone('utc'::text, now()) - interval '2 days'),
  (9, 'user_01KGG4R8HZAV513662YE3DJ0A9', 5, 'practice', 'Derivative of x^2', '2x', 9, timezone('utc'::text, now()) - interval '10 days', timezone('utc'::text, now()) - interval '2 days'),
  (10, 'user_01KGG4R8HZAV513662YE3DJ0A9', 6, 'flashcard', 'Define idempotency', 'Repeated operation has same effect as single operation.', 10, timezone('utc'::text, now()) - interval '9 days', timezone('utc'::text, now()) - interval '2 days'),
  (11, 'user_01KGG4R8HZAV513662YE3DJ0A9', 8, 'practice', 'Legacy practice prompt', 'Legacy answer', 11, timezone('utc'::text, now()) - interval '40 days', timezone('utc'::text, now()) - interval '20 days'),
  (12, 'user_01KGG4R8HZAV513662YE3DJ0A9', 8, 'flashcard', 'Legacy flashcard prompt', 'Legacy answer', 12, timezone('utc'::text, now()) - interval '39 days', timezone('utc'::text, now()) - interval '20 days');

INSERT INTO review_card_types (review_card_id, type)
SELECT id, type
FROM review_cards;

-- Due/scheduled queue entries (uncompleted).
INSERT INTO reviews (
  id,
  user_id,
  review_card_id,
  description,
  notes,
  scheduled_at,
  completed_at,
  rating
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'user_01KGG4R8HZAV513662YE3DJ0A9', 1, 'Due algebra drill', '', CURRENT_DATE - 1, NULL, NULL),
  (2, 'user_01KGG4R8HZAV513662YE3DJ0A9', 2, 'Today factoring drill', '', CURRENT_DATE, NULL, NULL),
  (3, 'user_01KGG4R8HZAV513662YE3DJ0A9', 5, 'Upcoming CAP recall', '', CURRENT_DATE + 2, NULL, NULL),
  (4, 'user_01KGG4R8HZAV513662YE3DJ0A9', 8, 'Unscheduled interview recall', '', NULL, NULL, NULL);

-- Completed reviews (recent + older) for status badges/logbook/history.
INSERT INTO reviews (
  id,
  user_id,
  review_card_id,
  description,
  notes,
  scheduled_at,
  completed_at,
  rating,
  stability_before,
  difficulty_before,
  state_before,
  step_before,
  due_before,
  stability_after,
  difficulty_after,
  state_after,
  step_after,
  due_after
)
OVERRIDING SYSTEM VALUE
VALUES
  (100, 'user_01KGG4R8HZAV513662YE3DJ0A9', 3, 'Recent completed systems review', 'Used production example.', CURRENT_DATE - 4, CURRENT_DATE - 4, 'good', 2.2, 2.8, 'REVIEW', NULL, CURRENT_DATE - 1, 2.8, 2.6, 'REVIEW', NULL, CURRENT_DATE + 3),
  (101, 'user_01KGG4R8HZAV513662YE3DJ0A9', 4, 'Recent completed interview review', 'Practiced whiteboard explanation.', CURRENT_DATE - 3, CURRENT_DATE - 3, 'hard', 2.0, 3.0, 'REVIEW', NULL, CURRENT_DATE - 1, 2.3, 2.9, 'REVIEW', NULL, CURRENT_DATE + 2),
  (102, 'user_01KGG4R8HZAV513662YE3DJ0A9', 6, 'Recent completed flashcard recall', 'Fast answer, no hesitation.', CURRENT_DATE - 2, CURRENT_DATE - 2, 'easy', 2.6, 2.7, 'REVIEW', NULL, CURRENT_DATE, 3.1, 2.4, 'REVIEW', NULL, CURRENT_DATE + 5),
  (200, 'user_01KGG4R8HZAV513662YE3DJ0A9', 7, 'Older distributed systems recall', 'Needed hint for terminology.', CURRENT_DATE - 21, CURRENT_DATE - 21, 'miss', 1.9, 3.2, 'REVIEW', NULL, CURRENT_DATE - 10, 2.1, 3.0, 'RELEARNING', 1, CURRENT_DATE - 2);

SELECT setval('topics_id_seq', (SELECT COALESCE(MAX(id), 1) FROM topics), true);
SELECT setval('fsrs_states_id_seq', (SELECT COALESCE(MAX(id), 1) FROM fsrs_states), true);
SELECT setval('review_cards_id_seq', (SELECT COALESCE(MAX(id), 1) FROM review_cards), true);
SELECT setval('reviews_id_seq', (SELECT COALESCE(MAX(id), 1) FROM reviews), true);

COMMIT;
