-- Rich seed data for Topics + Review Cards.
-- IMPORTANT: seed only the real WorkOS test user used by E2E.

BEGIN;

TRUNCATE TABLE review_card_types, reviews, review_cards, topics, fsrs_states
RESTART IDENTITY CASCADE;

-- Real WorkOS test user id (workostest@protonmail.com)
WITH topic_seed (id, title, body, parent_id, created_days_ago, updated_days_ago) AS (
  VALUES
    (1, 'Mathematics', 'Core math topics for proofs, intuition, and drills.', NULL, 120, 2),
    (2, 'Algebra', 'Equations, manipulation, and symbolic fluency.', 1, 110, 3),
    (3, 'Geometry', 'Shapes, angles, and visual reasoning.', 1, 108, 8),
    (4, 'Calculus', 'Rates of change, accumulation, and approximation.', 1, 105, 5),
    (5, 'Computer Science', 'Foundational systems, code, and problem solving.', NULL, 118, 1),
    (6, 'Data Structures', 'Collections, tradeoffs, and implementation details.', 5, 112, 3),
    (7, 'Algorithms', 'Runtime reasoning and canonical techniques.', 5, 111, 2),
    (8, 'Distributed Systems', 'Replication, coordination, and failure modes.', 5, 109, 1),
    (9, 'Backend Engineering', 'APIs, services, and production concerns.', 5, 106, 4),
    (10, 'Languages', 'Speaking, listening, grammar, and recall.', NULL, 116, 4),
    (11, 'Spanish', 'Travel and conversation focused Spanish study.', 10, 101, 2),
    (12, 'Japanese', 'Basic vocabulary, listening, and kana/kanji.', 10, 99, 7),
    (13, 'Writing', 'Writing clearly under time and revision pressure.', NULL, 114, 3),
    (14, 'Essays', 'Arguments, structure, and stronger revision passes.', 13, 100, 5),
    (15, 'Public Speaking', 'Delivery, pacing, and audience attention.', 13, 98, 2),
    (16, 'Product Design', 'Research, product thinking, and visual systems.', NULL, 113, 2),
    (17, 'UX Research', 'Interviewing users and synthesizing insight.', 16, 97, 2),
    (18, 'Visual Design', 'Hierarchy, contrast, composition, and polish.', 16, 96, 6),
    (19, 'Career Growth', 'Interviewing, systems thinking, and professional leverage.', NULL, 112, 1),
    (20, 'Interview Prep', 'Technical reps and communication reps.', 19, 95, 1),
    (21, 'System Design', 'Tradeoffs, constraints, and large-scale reasoning.', 19, 94, 3),
    (22, 'Behavioral Stories', 'Career narratives with concrete impact.', 19, 93, 4),
    (23, 'Science', 'Scientific models, mechanisms, and recall.', NULL, 111, 5),
    (24, 'Physics', 'Forces, motion, and quantitative intuition.', 23, 92, 3),
    (25, 'Biology', 'Cells, systems, and function-focused recall.', 23, 91, 7),
    (26, 'History', 'Chronology, context, and causation.', NULL, 110, 6),
    (27, 'Ancient History', 'Civilizations, codes, and early empires.', 26, 90, 9),
    (28, 'Modern History', 'Industrial, political, and social turning points.', 26, 89, 4),
    (29, 'Wellness', 'Training, recovery, and sustainable routines.', NULL, 109, 4),
    (30, 'Strength Training', 'Programming and exercise execution.', 29, 88, 2),
    (31, 'Nutrition', 'Macros, meal planning, and adherence.', 29, 87, 1),
    (32, 'Legacy Topics', 'Retired content kept around for regression coverage.', NULL, 108, 20),
    (33, 'Retired Interview Questions', 'Old prompts that still need to render safely.', 32, 86, 18),
    (34, 'Retired Flashcards', 'Archived recall cards from an earlier taxonomy.', 32, 85, 19),
    (35, 'Linear Algebra', 'Vectors, matrices, and transformations.', 2, 84, 4),
    (36, 'Concurrency', 'Threads, synchronization, and contention.', 9, 83, 2),
    (37, 'Grammar', 'Tense, agreement, and sentence construction.', 11, 82, 3),
    (38, 'Kanji', 'High-frequency character recall and mnemonics.', 12, 81, 5),
    (39, 'Case Studies', 'Portfolio storytelling and project framing.', 17, 80, 3),
    (40, 'Networking', 'Protocols, addressing, and request lifecycles.', 8, 79, 2),
    (41, 'Meal Planning', 'Repeatable weekly systems for nutrition goals.', 31, 78, 3),
    (42, 'Renaissance', 'Ideas, art, and institutions reshaping Europe.', 28, 77, 6),
    (43, 'Probability', 'Randomness, expectation, and uncertainty.', 1, 76, 6),
    (44, 'Databases', 'Indexes, storage, and query behavior.', 9, 75, 2),
    (45, 'CSS Systems', 'Tokens, reuse, and resilient UI styling.', 18, 74, 5),
    (46, 'Mock Interviews', 'High-pressure reps with deliberate feedback loops.', 20, 73, 1)
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

-- A larger FSRS spread:
-- 1-28 mostly active reviewed cards, 29-36 mixed/new cards, 37-40 reviewable but SRS-disabled.
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
  CASE
    WHEN n >= 29 AND n <= 36 THEN NULL
    WHEN n IN (17, 18, 19, 20) THEN (0.9 + (n * 0.08))::real
    ELSE (2.0 + (n * 0.28))::real
  END,
  CASE
    WHEN n >= 29 AND n <= 36 THEN NULL
    ELSE (2.1 + ((n % 9) * 0.23))::real
  END,
  CASE
    WHEN n >= 29 AND n <= 36 THEN 'LEARNING'::learning_state
    WHEN n IN (4, 8, 12, 16, 20, 24, 28, 40) THEN 'RELEARNING'::learning_state
    ELSE 'REVIEW'::learning_state
  END,
  CASE
    WHEN n >= 29 AND n <= 36 THEN 0
    WHEN n IN (4, 8, 12, 16, 20, 24, 28, 40) THEN 1
    ELSE NULL
  END,
  CASE
    WHEN n >= 29 AND n <= 36 THEN NULL
    WHEN n IN (17, 18, 19, 20) THEN CURRENT_DATE - (10 + (n - 17))
    WHEN n IN (37, 38, 39, 40) THEN CURRENT_DATE - ((n % 4) + 2)
    ELSE CURRENT_DATE - ((n % 8) + 1)
  END,
  CASE WHEN n IN (37, 38, 39, 40) THEN false ELSE true END,
  timezone('utc'::text, now()) - ((70 - n) || ' days')::interval,
  timezone('utc'::text, now()) - ((n % 6) || ' days')::interval
FROM generate_series(1, 40) AS n;

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
  (1, 'user_01KGG4R8HZAV513662YE3DJ0A9', 2, 'practice', 'Solve a two-step linear equation quickly', 'Undo addition/subtraction first, then divide or multiply, then verify the result.', 1, timezone('utc'::text, now()) - interval '55 days', timezone('utc'::text, now()) - interval '2 days'),
  (2, 'user_01KGG4R8HZAV513662YE3DJ0A9', 35, 'practice', 'Compute a dot product without hesitation', 'Multiply aligned components, then sum the products.', 2, timezone('utc'::text, now()) - interval '54 days', timezone('utc'::text, now()) - interval '3 days'),
  (3, 'user_01KGG4R8HZAV513662YE3DJ0A9', 4, 'flashcard', 'Derivative of x^3', '3x^2', 3, timezone('utc'::text, now()) - interval '53 days', timezone('utc'::text, now()) - interval '4 days'),
  (4, 'user_01KGG4R8HZAV513662YE3DJ0A9', 3, 'flashcard', 'Sum of triangle interior angles', '180 degrees', 4, timezone('utc'::text, now()) - interval '52 days', timezone('utc'::text, now()) - interval '8 days'),
  (5, 'user_01KGG4R8HZAV513662YE3DJ0A9', 6, 'practice', 'Choose between stack and queue in an interview', 'Use a stack for LIFO backtracking or undo flows; use a queue for FIFO scheduling and BFS.', 5, timezone('utc'::text, now()) - interval '51 days', timezone('utc'::text, now()) - interval '1 days'),
  (6, 'user_01KGG4R8HZAV513662YE3DJ0A9', 7, 'flashcard', 'Binary search runtime', 'O(log n)', 6, timezone('utc'::text, now()) - interval '50 days', timezone('utc'::text, now()) - interval '2 days'),
  (7, 'user_01KGG4R8HZAV513662YE3DJ0A9', 8, 'practice', 'Explain quorum writes', 'A write commits after enough replicas acknowledge so read and write quorums overlap.', 7, timezone('utc'::text, now()) - interval '49 days', timezone('utc'::text, now()) - interval '1 days'),
  (8, 'user_01KGG4R8HZAV513662YE3DJ0A9', 40, 'flashcard', 'What does DNS caching reduce first?', 'Repeated recursive lookup latency and upstream load.', 8, timezone('utc'::text, now()) - interval '48 days', timezone('utc'::text, now()) - interval '3 days'),
  (9, 'user_01KGG4R8HZAV513662YE3DJ0A9', 9, 'practice', 'Design an idempotent webhook handler', 'Store a delivery identifier and make processing safe to replay.', 9, timezone('utc'::text, now()) - interval '47 days', timezone('utc'::text, now()) - interval '2 days'),
  (10, 'user_01KGG4R8HZAV513662YE3DJ0A9', 44, 'flashcard', 'What is an index seek?', 'A targeted lookup that navigates an index instead of scanning all rows.', 10, timezone('utc'::text, now()) - interval '46 days', timezone('utc'::text, now()) - interval '2 days'),
  (11, 'user_01KGG4R8HZAV513662YE3DJ0A9', 11, 'flashcard', 'How do you say "I would like" in Spanish?', 'Me gustaria', 11, timezone('utc'::text, now()) - interval '45 days', timezone('utc'::text, now()) - interval '2 days'),
  (12, 'user_01KGG4R8HZAV513662YE3DJ0A9', 37, 'practice', 'Choose between ser and estar', 'Use ser for identity or stable traits; use estar for states, conditions, and location.', 12, timezone('utc'::text, now()) - interval '44 days', timezone('utc'::text, now()) - interval '3 days'),
  (13, 'user_01KGG4R8HZAV513662YE3DJ0A9', 12, 'flashcard', 'Meaning of arigato gozaimasu', 'Thank you very much', 13, timezone('utc'::text, now()) - interval '43 days', timezone('utc'::text, now()) - interval '6 days'),
  (14, 'user_01KGG4R8HZAV513662YE3DJ0A9', 38, 'practice', 'Recall the kanji for water', 'The character is read as mizu or sui and is written with four simple strokes.', 14, timezone('utc'::text, now()) - interval '42 days', timezone('utc'::text, now()) - interval '4 days'),
  (15, 'user_01KGG4R8HZAV513662YE3DJ0A9', 14, 'practice', 'Write a tighter thesis statement', 'Make a debatable claim plus the main reason or structure that will support it.', 15, timezone('utc'::text, now()) - interval '41 days', timezone('utc'::text, now()) - interval '2 days'),
  (16, 'user_01KGG4R8HZAV513662YE3DJ0A9', 15, 'practice', 'Open a talk with a hook', 'Start with a sharp question, contrast, or story that earns the next sentence.', 16, timezone('utc'::text, now()) - interval '40 days', timezone('utc'::text, now()) - interval '1 days'),
  (17, 'user_01KGG4R8HZAV513662YE3DJ0A9', 17, 'practice', 'Write a neutral user interview question', 'Ask about a recent concrete behavior without implying the desired answer.', 17, timezone('utc'::text, now()) - interval '39 days', timezone('utc'::text, now()) - interval '2 days'),
  (18, 'user_01KGG4R8HZAV513662YE3DJ0A9', 39, 'flashcard', 'Case study structure', 'Problem, role, process, decisions, impact, and reflection.', 18, timezone('utc'::text, now()) - interval '38 days', timezone('utc'::text, now()) - interval '3 days'),
  (19, 'user_01KGG4R8HZAV513662YE3DJ0A9', 18, 'flashcard', 'What does contrast improve first?', 'Scanability and visual hierarchy.', 19, timezone('utc'::text, now()) - interval '37 days', timezone('utc'::text, now()) - interval '6 days'),
  (20, 'user_01KGG4R8HZAV513662YE3DJ0A9', 45, 'practice', 'When should a design token be extracted?', 'Extract it when the value carries semantic meaning and must stay consistent across components.', 20, timezone('utc'::text, now()) - interval '36 days', timezone('utc'::text, now()) - interval '4 days'),
  (21, 'user_01KGG4R8HZAV513662YE3DJ0A9', 20, 'practice', 'Answer "tell me about yourself"', 'Present present-past-future: where you are, why that path makes sense, and why this role now.', 21, timezone('utc'::text, now()) - interval '35 days', timezone('utc'::text, now()) - interval '1 days'),
  (22, 'user_01KGG4R8HZAV513662YE3DJ0A9', 46, 'practice', 'Recover after getting stuck in a mock interview', 'State what you know, name the uncertainty, then propose a reasonable next step.', 22, timezone('utc'::text, now()) - interval '34 days', timezone('utc'::text, now()) - interval '1 days'),
  (23, 'user_01KGG4R8HZAV513662YE3DJ0A9', 21, 'flashcard', 'CAP theorem in one line', 'During a partition you must trade consistency against availability.', 23, timezone('utc'::text, now()) - interval '33 days', timezone('utc'::text, now()) - interval '2 days'),
  (24, 'user_01KGG4R8HZAV513662YE3DJ0A9', 22, 'flashcard', 'STAR stands for?', 'Situation, Task, Action, Result.', 24, timezone('utc'::text, now()) - interval '32 days', timezone('utc'::text, now()) - interval '3 days'),
  (25, 'user_01KGG4R8HZAV513662YE3DJ0A9', 24, 'practice', 'First step in a free-body diagram', 'Isolate the object and label every external force acting on it.', 25, timezone('utc'::text, now()) - interval '31 days', timezone('utc'::text, now()) - interval '3 days'),
  (26, 'user_01KGG4R8HZAV513662YE3DJ0A9', 25, 'flashcard', 'Function of mitochondria', 'They generate ATP through cellular respiration.', 26, timezone('utc'::text, now()) - interval '30 days', timezone('utc'::text, now()) - interval '5 days'),
  (27, 'user_01KGG4R8HZAV513662YE3DJ0A9', 27, 'flashcard', 'What is Hammurabi''s Code?', 'An early Babylonian law code known for explicit written rules and penalties.', 27, timezone('utc'::text, now()) - interval '29 days', timezone('utc'::text, now()) - interval '7 days'),
  (28, 'user_01KGG4R8HZAV513662YE3DJ0A9', 42, 'practice', 'Name one Renaissance turning point', 'The printing press accelerated the spread of ideas and learning.', 28, timezone('utc'::text, now()) - interval '28 days', timezone('utc'::text, now()) - interval '4 days'),
  (29, 'user_01KGG4R8HZAV513662YE3DJ0A9', 30, 'practice', 'Define progressive overload', 'Increase stress over time through load, reps, sets, or difficulty so the body adapts.', 29, timezone('utc'::text, now()) - interval '27 days', timezone('utc'::text, now()) - interval '2 days'),
  (30, 'user_01KGG4R8HZAV513662YE3DJ0A9', 31, 'flashcard', 'Protein target per kg for muscle gain', 'Roughly 1.6 to 2.2 grams per kilogram per day.', 30, timezone('utc'::text, now()) - interval '26 days', timezone('utc'::text, now()) - interval '1 days'),
  (31, 'user_01KGG4R8HZAV513662YE3DJ0A9', 41, 'practice', 'Build a simple cutting meal plan', 'Choose fixed meal templates, adequate protein, and a calorie target you can repeat.', 31, timezone('utc'::text, now()) - interval '25 days', timezone('utc'::text, now()) - interval '2 days'),
  (32, 'user_01KGG4R8HZAV513662YE3DJ0A9', 33, 'practice', 'Legacy whiteboard prompt', 'Clarify constraints, state tradeoffs, and keep the old flow rendering correctly.', 32, timezone('utc'::text, now()) - interval '24 days', timezone('utc'::text, now()) - interval '18 days'),
  (33, 'user_01KGG4R8HZAV513662YE3DJ0A9', 34, 'flashcard', 'Legacy cache invalidation quote', 'There are only two hard things in computer science: cache invalidation and naming things.', 33, timezone('utc'::text, now()) - interval '23 days', timezone('utc'::text, now()) - interval '19 days'),
  (34, 'user_01KGG4R8HZAV513662YE3DJ0A9', 1, 'flashcard', 'What is the Feynman technique?', 'Explain the idea simply, identify gaps, then refine until the explanation is clear.', 34, timezone('utc'::text, now()) - interval '22 days', timezone('utc'::text, now()) - interval '2 days'),
  (35, 'user_01KGG4R8HZAV513662YE3DJ0A9', 5, 'flashcard', 'Difference between a process and a thread', 'Processes isolate memory; threads share memory within a process.', 35, timezone('utc'::text, now()) - interval '21 days', timezone('utc'::text, now()) - interval '1 days'),
  (36, 'user_01KGG4R8HZAV513662YE3DJ0A9', 10, 'practice', 'Thirty-minute language study loop', 'Review old cards, shadow audio, speak aloud, and end with short recall writing.', 36, timezone('utc'::text, now()) - interval '20 days', timezone('utc'::text, now()) - interval '3 days'),
  (37, 'user_01KGG4R8HZAV513662YE3DJ0A9', 19, 'practice', 'Run a weekly career growth review', 'Audit wins, bottlenecks, evidence of impact, and the single skill to push next.', 37, timezone('utc'::text, now()) - interval '19 days', timezone('utc'::text, now()) - interval '2 days'),
  (38, 'user_01KGG4R8HZAV513662YE3DJ0A9', 23, 'flashcard', 'Difference between hypothesis and theory', 'A hypothesis is a testable claim; a theory is a broader explanatory framework backed by evidence.', 38, timezone('utc'::text, now()) - interval '18 days', timezone('utc'::text, now()) - interval '2 days'),
  (39, 'user_01KGG4R8HZAV513662YE3DJ0A9', 26, 'flashcard', 'Primary versus secondary source', 'A primary source is direct evidence from the time; a secondary source interprets it later.', 39, timezone('utc'::text, now()) - interval '17 days', timezone('utc'::text, now()) - interval '2 days'),
  (40, 'user_01KGG4R8HZAV513662YE3DJ0A9', 29, 'flashcard', 'Why schedule recovery days?', 'Recovery lets adaptation happen and reduces injury risk from accumulated fatigue.', 40, timezone('utc'::text, now()) - interval '16 days', timezone('utc'::text, now()) - interval '1 days');

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
  (1, 'user_01KGG4R8HZAV513662YE3DJ0A9', 1, 'Overdue algebra drill', '', CURRENT_DATE - 1, NULL, NULL),
  (2, 'user_01KGG4R8HZAV513662YE3DJ0A9', 2, 'Today linear algebra warm-up', '', CURRENT_DATE, NULL, NULL),
  (3, 'user_01KGG4R8HZAV513662YE3DJ0A9', 5, 'Tomorrow data structures rep', '', CURRENT_DATE + 1, NULL, NULL),
  (4, 'user_01KGG4R8HZAV513662YE3DJ0A9', 7, 'Upcoming quorum recall', '', CURRENT_DATE + 2, NULL, NULL),
  (5, 'user_01KGG4R8HZAV513662YE3DJ0A9', 11, 'Spanish phrase recall overdue', '', CURRENT_DATE - 4, NULL, NULL),
  (6, 'user_01KGG4R8HZAV513662YE3DJ0A9', 15, 'Essay thesis refinement today', '', CURRENT_DATE, NULL, NULL),
  (7, 'user_01KGG4R8HZAV513662YE3DJ0A9', 18, 'Unscheduled case study refresh', '', NULL, NULL, NULL),
  (8, 'user_01KGG4R8HZAV513662YE3DJ0A9', 21, 'Interview opener tomorrow', '', CURRENT_DATE + 1, NULL, NULL),
  (9, 'user_01KGG4R8HZAV513662YE3DJ0A9', 23, 'System design recall today', '', CURRENT_DATE, NULL, NULL),
  (10, 'user_01KGG4R8HZAV513662YE3DJ0A9', 29, 'Training definition review', '', CURRENT_DATE + 3, NULL, NULL),
  (11, 'user_01KGG4R8HZAV513662YE3DJ0A9', 34, 'Math meta-learning recall today', '', CURRENT_DATE, NULL, NULL),
  (12, 'user_01KGG4R8HZAV513662YE3DJ0A9', 38, 'Unscheduled science distinction recall', '', NULL, NULL, NULL),
  (13, 'user_01KGG4R8HZAV513662YE3DJ0A9', 40, 'Recovery-day recall overdue', '', CURRENT_DATE - 2, NULL, NULL),
  (14, 'user_01KGG4R8HZAV513662YE3DJ0A9', 30, 'Nutrition target recall later this week', '', CURRENT_DATE + 5, NULL, NULL);

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
  (100, 'user_01KGG4R8HZAV513662YE3DJ0A9', 6, 'Recent completed algorithms recall', 'Answer came immediately.', CURRENT_DATE - 2, CURRENT_DATE - 2, 'easy', 3.2, 2.8, 'REVIEW', NULL, CURRENT_DATE, 3.9, 2.5, 'REVIEW', NULL, CURRENT_DATE + 6),
  (101, 'user_01KGG4R8HZAV513662YE3DJ0A9', 8, 'Recent networking review', 'Mixed up resolver and authoritative server once.', CURRENT_DATE - 3, CURRENT_DATE - 3, 'good', 2.4, 3.0, 'RELEARNING', 1, CURRENT_DATE - 1, 2.8, 2.8, 'REVIEW', NULL, CURRENT_DATE + 4),
  (102, 'user_01KGG4R8HZAV513662YE3DJ0A9', 9, 'Recent backend systems review', 'Used webhook example from Stripe.', CURRENT_DATE - 4, CURRENT_DATE - 4, 'hard', 2.6, 3.2, 'REVIEW', NULL, CURRENT_DATE - 1, 2.9, 3.0, 'REVIEW', NULL, CURRENT_DATE + 3),
  (103, 'user_01KGG4R8HZAV513662YE3DJ0A9', 10, 'Older databases review', 'Forgot the difference between seek and scan at first.', CURRENT_DATE - 16, CURRENT_DATE - 16, 'miss', 1.8, 3.4, 'REVIEW', NULL, CURRENT_DATE - 8, 2.1, 3.1, 'RELEARNING', 1, CURRENT_DATE - 1),
  (104, 'user_01KGG4R8HZAV513662YE3DJ0A9', 16, 'Recent speaking drill', 'Hook was stronger than the close.', CURRENT_DATE - 2, CURRENT_DATE - 2, 'good', 2.5, 2.9, 'RELEARNING', 1, CURRENT_DATE, 2.9, 2.7, 'REVIEW', NULL, CURRENT_DATE + 4),
  (105, 'user_01KGG4R8HZAV513662YE3DJ0A9', 17, 'Recent research review', 'Needed a reminder to stay neutral.', CURRENT_DATE - 5, CURRENT_DATE - 5, 'hard', 1.9, 3.3, 'REVIEW', NULL, CURRENT_DATE - 2, 2.2, 3.0, 'REVIEW', NULL, CURRENT_DATE + 2),
  (106, 'user_01KGG4R8HZAV513662YE3DJ0A9', 20, 'Older design systems review', 'Remembered the token rule after a pause.', CURRENT_DATE - 12, CURRENT_DATE - 12, 'easy', 2.8, 2.6, 'REVIEW', NULL, CURRENT_DATE - 3, 3.5, 2.4, 'REVIEW', NULL, CURRENT_DATE + 7),
  (107, 'user_01KGG4R8HZAV513662YE3DJ0A9', 22, 'Recent mock interview review', 'Recovered but still rambled.', CURRENT_DATE - 1, CURRENT_DATE - 1, 'miss', 1.7, 3.5, 'REVIEW', NULL, CURRENT_DATE, 1.9, 3.2, 'RELEARNING', 1, CURRENT_DATE + 1),
  (108, 'user_01KGG4R8HZAV513662YE3DJ0A9', 24, 'Recent behavioral flashcard recall', 'STAR order was automatic.', CURRENT_DATE - 2, CURRENT_DATE - 2, 'easy', 3.0, 2.5, 'REVIEW', NULL, CURRENT_DATE, 3.7, 2.3, 'REVIEW', NULL, CURRENT_DATE + 6),
  (109, 'user_01KGG4R8HZAV513662YE3DJ0A9', 25, 'Physics review last week', 'Got the force directions right.', CURRENT_DATE - 7, CURRENT_DATE - 7, 'good', 2.3, 2.9, 'REVIEW', NULL, CURRENT_DATE - 1, 2.8, 2.7, 'REVIEW', NULL, CURRENT_DATE + 4),
  (110, 'user_01KGG4R8HZAV513662YE3DJ0A9', 27, 'Ancient history review', 'Could not place the Babylonian context initially.', CURRENT_DATE - 13, CURRENT_DATE - 13, 'miss', 1.6, 3.2, 'REVIEW', NULL, CURRENT_DATE - 5, 1.9, 3.0, 'RELEARNING', 1, CURRENT_DATE + 1),
  (111, 'user_01KGG4R8HZAV513662YE3DJ0A9', 31, 'Meal-planning review', 'The template approach felt reusable.', CURRENT_DATE - 3, CURRENT_DATE - 3, 'good', 2.1, 2.8, 'REVIEW', NULL, CURRENT_DATE - 1, 2.6, 2.6, 'REVIEW', NULL, CURRENT_DATE + 4),
  (112, 'user_01KGG4R8HZAV513662YE3DJ0A9', 35, 'Recent CS fundamentals review', 'Confident answer with a scheduler example.', CURRENT_DATE - 2, CURRENT_DATE - 2, 'easy', 3.1, 2.7, 'REVIEW', NULL, CURRENT_DATE, 3.8, 2.4, 'REVIEW', NULL, CURRENT_DATE + 5),
  (113, 'user_01KGG4R8HZAV513662YE3DJ0A9', 39, 'History methods recall', 'Primary-source definition was clean.', CURRENT_DATE - 4, CURRENT_DATE - 4, 'good', 2.7, 2.8, 'REVIEW', NULL, CURRENT_DATE - 1, 3.1, 2.6, 'REVIEW', NULL, CURRENT_DATE + 5),
  (114, 'user_01KGG4R8HZAV513662YE3DJ0A9', 3, 'Recent calculus recall', 'Derivative rule came back after the first beat.', CURRENT_DATE - 6, CURRENT_DATE - 6, 'hard', 2.0, 3.1, 'REVIEW', NULL, CURRENT_DATE - 2, 2.4, 2.9, 'REVIEW', NULL, CURRENT_DATE + 2),
  (115, 'user_01KGG4R8HZAV513662YE3DJ0A9', 23, 'Older system design recall', 'Needed the partition caveat.', CURRENT_DATE - 15, CURRENT_DATE - 15, 'good', 2.4, 3.0, 'REVIEW', NULL, CURRENT_DATE - 6, 2.9, 2.8, 'REVIEW', NULL, CURRENT_DATE + 3),
  (116, 'user_01KGG4R8HZAV513662YE3DJ0A9', 1, 'Older algebra review', 'Solved it but skipped the verification step.', CURRENT_DATE - 11, CURRENT_DATE - 11, 'miss', 1.9, 3.3, 'REVIEW', NULL, CURRENT_DATE - 4, 2.1, 3.1, 'RELEARNING', 1, CURRENT_DATE + 1);

SELECT setval('topics_id_seq', (SELECT COALESCE(MAX(id), 1) FROM topics), true);
SELECT setval('fsrs_states_id_seq', (SELECT COALESCE(MAX(id), 1) FROM fsrs_states), true);
SELECT setval('review_cards_id_seq', (SELECT COALESCE(MAX(id), 1) FROM review_cards), true);
SELECT setval('reviews_id_seq', (SELECT COALESCE(MAX(id), 1) FROM reviews), true);

COMMIT;
