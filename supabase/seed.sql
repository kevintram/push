-- Rich seed data for Topics + Review Cards.
-- IMPORTANT: seed only the real WorkOS test user used by E2E.

BEGIN;

TRUNCATE TABLE review_card_types, reviews, review_cards, topics
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
    (46, 'Mock Interviews', 'High-pressure reps with deliberate feedback loops.', 20, 73, 1),
    (
      47,
      'UI Overflow Lab',
      'This root topic exists specifically to stress the card layout with a body that is much longer than the ordinary seed content. It includes a dense explanation of how a user might document an issue: first they describe the visible symptom, then they describe the exact interaction that triggers it, then they capture what they expected to happen, and finally they list every clue that might help them reproduce it later. The paragraph keeps going on purpose so the topic card has enough text to clamp, scroll, and expose any unstable sizing assumptions in the masonry grid. To make that practical for debugging, it mentions nested states, delayed measurements, responsive widths, scroll containers, reveal controls, and why a card that appears visually harmless can still be a pathological layout case when the content is several times longer than the visible shell.',
      NULL,
      72,
      1
    ),
    (
      48,
      'Dense Reading Notes',
      'This is another intentionally long root topic designed to create a topic card with a body large enough to need internal scrolling. Imagine a user dumping structured reading notes into a topic after a study session: the body contains the summary of the chapter, a list of confusing ideas, a short explanation in plain language, a concrete example, a reminder to revisit edge cases, and a final reflection about what still feels shaky. That combination is realistic enough to mirror production use, but verbose enough to surface UI problems that only appear when the text area is forced to balance clamping, wrapping, and overflow behavior. The goal of this fixture is not realism alone; it is to make sure the masonry layout can survive a card whose natural content height is far larger than its rendered height.',
      NULL,
      71,
      1
    )
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
-- 1-28 mostly active reviewed cards, 29-36 mixed/new cards, 37-40 reviewable but retired from the queue.
WITH fsrs_data AS (
  SELECT
    n AS legacy_id,
    CASE
      WHEN n >= 29 AND n <= 36 THEN NULL
      WHEN n IN (17, 18, 19, 20) THEN (0.9 + (n * 0.08))::real
      ELSE (2.0 + (n * 0.28))::real
    END AS stability,
    CASE
      WHEN n >= 29 AND n <= 36 THEN NULL
      ELSE (2.1 + ((n % 9) * 0.23))::real
    END AS difficulty,
    CASE
      WHEN n >= 29 AND n <= 36 THEN 'LEARNING'::learning_state
      WHEN n IN (4, 8, 12, 16, 20, 24, 28, 40) THEN 'RELEARNING'::learning_state
      ELSE 'REVIEW'::learning_state
    END AS state,
    CASE
      WHEN n >= 29 AND n <= 36 THEN 0
      WHEN n IN (4, 8, 12, 16, 20, 24, 28, 40) THEN 1
      ELSE NULL
    END AS step,
    CASE
      WHEN n >= 29 AND n <= 36 THEN NULL
      WHEN n IN (17, 18, 19, 20) THEN CURRENT_DATE - (10 + (n - 17))
      WHEN n IN (37, 38, 39, 40) THEN CURRENT_DATE - ((n % 4) + 2)
      ELSE CURRENT_DATE - ((n % 8) + 1)
    END AS last_reviewed_at,
    CASE WHEN n IN (37, 38, 39, 40) THEN true ELSE false END AS retired
  FROM generate_series(1, 44) AS n
),
seeded_cards (
  id,
  user_id,
  topic_id,
  type,
  primary_text,
  secondary_text,
  legacy_fsrs_id,
  inserted_at,
  updated_at
) AS (
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
    (40, 'user_01KGG4R8HZAV513662YE3DJ0A9', 29, 'flashcard', 'Why schedule recovery days?', 'Recovery lets adaptation happen and reduces injury risk from accumulated fatigue.', 40, timezone('utc'::text, now()) - interval '16 days', timezone('utc'::text, now()) - interval '1 days'),
    (
      41,
      'user_01KGG4R8HZAV513662YE3DJ0A9',
      47,
      'practice',
      'Explain why masonry layouts are sensitive to stale height measurements',
      'A masonry layout is sensitive to stale height measurements because every item placement depends on the heights that came before it in each lane. If a card is measured once and then its inner content changes without the outer layout being remeasured, the virtualizer can keep positioning later cards as though the old height were still true. That means one lane may reserve too much space, another lane may overlap, and the whole grid can look randomly broken even though the bug is simply that the cache was never invalidated. In practice, the failure shows up most clearly when a card toggles between a long scrollable answer and a shorter reveal state, because the content looks similar conceptually but the rendered geometry is very different.',
      41,
      timezone('utc'::text, now()) - interval '15 days',
      timezone('utc'::text, now()) - interval '1 days'
    ),
    (
      42,
      'user_01KGG4R8HZAV513662YE3DJ0A9',
      47,
      'flashcard',
      'What kind of text content is most useful for overflow regression testing?',
      'The most useful text for overflow regression testing is realistic but intentionally oversized. It should be long enough to wrap across many lines, include punctuation and sentence breaks that mimic real notes, and contain enough semantic structure that a developer can tell whether the card is clipping, scrolling, or collapsing in the wrong way. Short lorem ipsum is not enough, because it does not create the same line lengths or perceived density as real product content. A better seed is a dense explanation, a numbered idea sequence, or a reflective note that keeps going until the card is forced to choose between internal scrolling and increasing its outer height.',
      42,
      timezone('utc'::text, now()) - interval '14 days',
      timezone('utc'::text, now()) - interval '1 days'
    ),
    (
      43,
      'user_01KGG4R8HZAV513662YE3DJ0A9',
      48,
      'practice',
      'Summarize a long note without losing the structural markers',
      'Start by finding the spine of the note: what problem it is about, what sequence of ideas it follows, where the examples appear, and how the author closes the argument. Then compress each section into one or two sentences without flattening everything into a single blob. The point of the summary is not just brevity; it is preserving the original map so a reader can still tell where context ends, where the key insight begins, where the exception lives, and where the next action belongs. That makes this answer intentionally long enough to generate a scrollable card while still reading like something a real user might store in the system.',
      43,
      timezone('utc'::text, now()) - interval '13 days',
      timezone('utc'::text, now()) - interval '1 days'
    ),
    (
      44,
      'user_01KGG4R8HZAV513662YE3DJ0A9',
      48,
      'flashcard',
      'Why does clipping feel different from scrolling in a note card?',
      'Clipping and scrolling feel different because clipping hides information with no recovery path inside the component, while scrolling makes the component admit that more content exists and gives the user a way to reach it. In a note card, that difference matters because clipping can make the card look tidy while silently dropping context, whereas scrolling preserves the content model but changes how the layout engine has to reason about the card height. For UI debugging, that distinction is important: a bug may not be in the text rendering itself, but in the mismatch between the fixed shell that the grid expects and the overflow behavior that the card body actually uses.',
      44,
      timezone('utc'::text, now()) - interval '12 days',
      timezone('utc'::text, now()) - interval '1 days'
    )
)
INSERT INTO review_cards (
  id,
  user_id,
  topic_id,
  type,
  primary_text,
  secondary_text,
  stability,
  difficulty,
  state,
  step,
  last_reviewed_at,
  retired,
  inserted_at,
  updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
  seeded_cards.id,
  seeded_cards.user_id,
  seeded_cards.topic_id,
  seeded_cards.type::review_card_type,
  seeded_cards.primary_text,
  seeded_cards.secondary_text,
  fsrs_data.stability,
  fsrs_data.difficulty,
  fsrs_data.state,
  fsrs_data.step,
  fsrs_data.last_reviewed_at,
  fsrs_data.retired,
  seeded_cards.inserted_at,
  seeded_cards.updated_at
FROM seeded_cards
LEFT JOIN fsrs_data ON fsrs_data.legacy_id = seeded_cards.legacy_fsrs_id;

INSERT INTO review_card_types (review_card_id, type)
SELECT id, type
FROM review_cards;

UPDATE review_cards
SET flagged_at = timezone('utc'::text, now()) - interval '1 day'
WHERE id IN (20, 24, 33);

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
  (4, 'user_01KGG4R8HZAV513662YE3DJ0A9', 7, 'Next-week quorum recall', '', CURRENT_DATE + 7, NULL, NULL),
  (5, 'user_01KGG4R8HZAV513662YE3DJ0A9', 11, 'Spanish phrase recall overdue', '', CURRENT_DATE - 1, NULL, NULL),
  (6, 'user_01KGG4R8HZAV513662YE3DJ0A9', 15, 'Essay thesis refinement today', '', CURRENT_DATE, NULL, NULL),
  (7, 'user_01KGG4R8HZAV513662YE3DJ0A9', 18, 'Unscheduled case study refresh', '', NULL, NULL, NULL),
  (8, 'user_01KGG4R8HZAV513662YE3DJ0A9', 21, 'Interview opener tomorrow', '', CURRENT_DATE + 1, NULL, NULL),
  (9, 'user_01KGG4R8HZAV513662YE3DJ0A9', 23, 'System design recall today', '', CURRENT_DATE, NULL, NULL),
  (10, 'user_01KGG4R8HZAV513662YE3DJ0A9', 20, 'Design-token review next week', '', CURRENT_DATE + 7, NULL, NULL),
  (11, 'user_01KGG4R8HZAV513662YE3DJ0A9', 24, 'Behavioral story recall today', '', CURRENT_DATE, NULL, NULL),
  (12, 'user_01KGG4R8HZAV513662YE3DJ0A9', 38, 'Unscheduled science distinction recall', '', NULL, NULL, NULL),
  (13, 'user_01KGG4R8HZAV513662YE3DJ0A9', 40, 'Recovery-day recall overdue', '', CURRENT_DATE - 2, NULL, NULL),
  (14, 'user_01KGG4R8HZAV513662YE3DJ0A9', 26, 'Biology recall next week', '', CURRENT_DATE + 7, NULL, NULL),
  (15, 'user_01KGG4R8HZAV513662YE3DJ0A9', 41, 'Long masonry explanation due today', '', CURRENT_DATE, NULL, NULL),
  (16, 'user_01KGG4R8HZAV513662YE3DJ0A9', 42, 'Long overflow testing flashcard tomorrow', '', CURRENT_DATE + 1, NULL, NULL),
  (17, 'user_01KGG4R8HZAV513662YE3DJ0A9', 43, 'Dense reading-note practice next week', '', CURRENT_DATE + 7, NULL, NULL),
  (18, 'user_01KGG4R8HZAV513662YE3DJ0A9', 44, 'Scrolling versus clipping flashcard overdue', '', CURRENT_DATE - 3, NULL, NULL);

-- Completed reviews for status badges, logbook, and coherent FSRS history.
-- Cards 29-36 intentionally have no completed history so they are true new cards.
WITH reviewed_card_ids AS (
  SELECT n AS review_card_id
  FROM generate_series(1, 28) AS n
  UNION ALL
  SELECT n AS review_card_id
  FROM generate_series(37, 44) AS n
), completed_seed AS (
  SELECT
    99 + row_number() OVER (ORDER BY review_card_id) AS id,
    review_card_id,
    CASE
      WHEN review_card_id IN (17, 18, 19, 20) THEN CURRENT_DATE - (10 + (review_card_id - 17))
      WHEN review_card_id IN (37, 38, 39, 40) THEN CURRENT_DATE - ((review_card_id % 4) + 2)
      ELSE CURRENT_DATE - ((review_card_id % 8) + 1)
    END AS completed_date,
    CASE
      WHEN review_card_id % 7 = 0 THEN 'miss'
      WHEN review_card_id % 5 = 0 THEN 'hard'
      WHEN review_card_id % 3 = 0 THEN 'easy'
      ELSE 'good'
    END AS rating_text
  FROM reviewed_card_ids
)
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
SELECT
  completed_seed.id,
  review_cards.user_id,
  completed_seed.review_card_id,
  'Completed seed review: ' || review_cards.primary_text,
  CASE
    WHEN completed_seed.rating_text = 'easy' THEN 'Answer came immediately.'
    WHEN completed_seed.rating_text = 'good' THEN 'Solid recall with a short pause.'
    WHEN completed_seed.rating_text = 'hard' THEN 'Remembered after working through the prompt.'
    ELSE 'Missed the first attempt and marked for relearning.'
  END,
  completed_seed.completed_date,
  completed_seed.completed_date,
  completed_seed.rating_text::rating,
  (1.8 + (completed_seed.review_card_id * 0.04))::real,
  (2.4 + ((completed_seed.review_card_id % 6) * 0.12))::real,
  'REVIEW'::learning_state,
  NULL,
  completed_seed.completed_date,
  (2.1 + (completed_seed.review_card_id * 0.05))::real,
  (2.2 + ((completed_seed.review_card_id % 5) * 0.10))::real,
  CASE
    WHEN completed_seed.rating_text = 'miss' THEN 'RELEARNING'::learning_state
    ELSE 'REVIEW'::learning_state
  END,
  CASE WHEN completed_seed.rating_text = 'miss' THEN 1 ELSE NULL END,
  completed_seed.completed_date + CASE
    WHEN completed_seed.rating_text = 'easy' THEN 7
    WHEN completed_seed.rating_text = 'good' THEN 5
    WHEN completed_seed.rating_text = 'hard' THEN 2
    ELSE 1
  END
FROM completed_seed
JOIN review_cards ON review_cards.id = completed_seed.review_card_id;

-- Older logbook anchors that are stable across month/year boundaries.
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
  (200, 'user_01KGG4R8HZAV513662YE3DJ0A9', 6, 'Previous-month algorithms recall', 'Regression fixture for logbook month grouping.', (date_trunc('month', CURRENT_DATE)::date - 1), (date_trunc('month', CURRENT_DATE)::date - 1), 'good', 2.4, 2.8, 'REVIEW', NULL, (date_trunc('month', CURRENT_DATE)::date - 3), 2.9, 2.6, 'REVIEW', NULL, (date_trunc('month', CURRENT_DATE)::date + 4)),
  (201, 'user_01KGG4R8HZAV513662YE3DJ0A9', 8, 'Previous-year networking recall', 'Regression fixture for logbook year grouping.', (date_trunc('year', CURRENT_DATE)::date - 1), (date_trunc('year', CURRENT_DATE)::date - 1), 'hard', 2.1, 3.0, 'REVIEW', NULL, (date_trunc('year', CURRENT_DATE)::date - 4), 2.4, 2.8, 'REVIEW', NULL, (date_trunc('year', CURRENT_DATE)::date + 2));

SELECT setval('topics_id_seq', (SELECT COALESCE(MAX(id), 1) FROM topics), true);
SELECT setval('review_cards_id_seq', (SELECT COALESCE(MAX(id), 1) FROM review_cards), true);
SELECT setval('reviews_id_seq', (SELECT COALESCE(MAX(id), 1) FROM reviews), true);

COMMIT;
