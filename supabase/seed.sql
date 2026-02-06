-- Seed data for local development
-- User ID: user_01KGG4R8HZAV513662YE3DJ0A9

-- ============================================================================
-- FSRS STATES
-- ============================================================================
-- Create FSRS states for topics that have SRS enabled

INSERT INTO fsrs_states (id, stability, difficulty, state, step, last_reviewed_at, srs_enabled, inherited_stability, inherited_difficulty, inherited_state, inherited_step, inherited_last_review)
OVERRIDING SYSTEM VALUE
VALUES
  -- Programming (id=1)
  (1, 45.0, 3.5, 'REVIEW', 0, '2026-01-15', true, NULL, NULL, NULL, NULL, NULL),
  -- Mathematics (id=2)
  (2, 30.0, 4.0, 'REVIEW', 0, '2026-01-10', true, NULL, NULL, NULL, NULL, NULL),
  -- Spanish (id=3)
  (3, 5.0, 5.5, 'LEARNING', 2, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  -- Ruby on Rails (id=4) - archived
  (4, 20.0, 4.0, 'REVIEW', 0, '2025-12-01', true, NULL, NULL, NULL, NULL, NULL),
  -- Kubernetes (id=5) - inboxed, new
  (5, NULL, NULL, 'LEARNING', 0, NULL, true, NULL, NULL, NULL, NULL, NULL),
  -- GraphQL (id=6) - inboxed, new
  (6, NULL, NULL, 'LEARNING', 0, NULL, true, NULL, NULL, NULL, NULL, NULL),
  -- TypeScript (id=7)
  (7, 25.0, 3.0, 'REVIEW', 0, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  -- Python (id=8)
  (8, 40.0, 2.5, 'REVIEW', 0, '2026-01-12', true, NULL, NULL, NULL, NULL, NULL),
  -- React (id=9)
  (9, 20.0, 4.5, 'REVIEW', 0, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  -- SQL (id=10)
  (10, 8.0, 5.0, 'LEARNING', 1, '2026-01-15', true, NULL, NULL, NULL, NULL, NULL),
  -- Git (id=11)
  (11, 60.0, 2.0, 'REVIEW', 0, '2026-01-01', true, NULL, NULL, NULL, NULL, NULL),
  -- Generics (id=12)
  (12, 4.0, 6.5, 'LEARNING', 2, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  -- Type Guards (id=13)
  (13, 15.0, 5.0, 'REVIEW', 0, '2026-01-10', true, NULL, NULL, NULL, NULL, NULL),
  -- Utility Types (id=14)
  (14, 2.0, 7.0, 'RELEARNING', 1, '2026-01-17', true, NULL, NULL, NULL, NULL, NULL),
  -- React Hooks (id=15)
  (15, 18.0, 4.0, 'REVIEW', 0, '2026-01-13', true, NULL, NULL, NULL, NULL, NULL),
  -- React Server Components (id=16)
  (16, 3.0, 7.5, 'LEARNING', 3, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  -- Linear Algebra (id=17)
  (17, 25.0, 5.5, 'REVIEW', 0, '2026-01-08', true, NULL, NULL, NULL, NULL, NULL),
  -- Calculus (id=18)
  (18, 35.0, 6.0, 'REVIEW', 0, '2026-01-05', true, NULL, NULL, NULL, NULL, NULL),
  -- Probability (id=19)
  (19, 6.0, 6.5, 'LEARNING', 2, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  -- Spanish Vocabulary (id=20)
  (20, 4.0, 4.5, 'LEARNING', 2, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  -- Spanish Grammar (id=21)
  (21, 3.0, 6.0, 'LEARNING', 3, '2026-01-17', true, NULL, NULL, NULL, NULL, NULL),
  -- Ser vs Estar (id=22)
  (22, 2.0, 7.0, 'LEARNING', 4, '2026-01-17', true, NULL, NULL, NULL, NULL, NULL);

-- Reset sequence
SELECT setval('fsrs_states_id_seq', (SELECT MAX(id) FROM fsrs_states));

-- ============================================================================
-- TOPICS
-- ============================================================================
-- A mix of programming, math, and language learning topics with various states
-- Using tree hierarchy with parent_id instead of closure table

INSERT INTO topics (id, user_id, name, notes, parent_id, path, fsrs_state_id, archived, inboxed, inserted_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  -- Root-level topics (no parent)
  -- Programming (will be id 1)
  (1, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Programming', 'Software development concepts and languages', NULL, '1', 1, false, false, NOW() - INTERVAL '60 days', NOW()),

  -- Mathematics (will be id 2)
  (2, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Mathematics', 'Mathematical foundations', NULL, '2', 2, false, false, NOW() - INTERVAL '45 days', NOW()),

  -- Spanish (will be id 3)
  (3, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Spanish', 'Learning Spanish language', NULL, '3', 3, false, false, NOW() - INTERVAL '14 days', NOW()),

  -- Archived topic (will be id 4)
  (4, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Ruby on Rails', 'Decided to focus on other frameworks', NULL, '4', 4, true, false, NOW() - INTERVAL '90 days', NOW()),

  -- Inboxed topics (newly added, not yet organized) (ids 5, 6)
  (5, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Kubernetes', 'Container orchestration - need to learn', NULL, '5', 5, false, true, NOW() - INTERVAL '2 days', NOW()),
  (6, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'GraphQL', 'API query language', NULL, '6', 6, false, true, NOW() - INTERVAL '1 day', NOW()),

  -- Programming subtopics (ids 7-11)
  -- TypeScript (child of Programming)
  (7, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'TypeScript', 'Type-safe JavaScript', 1, '1.7', 7, false, false, NOW() - INTERVAL '30 days', NOW()),

  -- Python (child of Programming)
  (8, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Python', 'Python programming language', 1, '1.8', 8, false, false, NOW() - INTERVAL '50 days', NOW()),

  -- React (child of Programming)
  (9, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'React', 'React framework and hooks', 1, '1.9', 9, false, false, NOW() - INTERVAL '25 days', NOW()),

  -- SQL (child of Programming)
  (10, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'SQL', 'Database queries and design', 1, '1.10', 10, false, false, NOW() - INTERVAL '10 days', NOW()),

  -- Git (child of Programming)
  (11, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Git', 'Version control with Git', 1, '1.11', 11, false, false, NOW() - INTERVAL '80 days', NOW()),

  -- TypeScript subtopics (grandchildren of Programming, ids 12-14)
  (12, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Generics', 'TypeScript generic types and constraints', 7, '1.7.12', 12, false, false, NOW() - INTERVAL '7 days', NOW()),
  (13, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Type Guards', 'Narrowing types with type guards', 7, '1.7.13', 13, false, false, NOW() - INTERVAL '14 days', NOW()),
  (14, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Utility Types', 'Partial, Required, Pick, Omit, etc.', 7, '1.7.14', 14, false, false, NOW() - INTERVAL '20 days', NOW()),

  -- React subtopics (ids 15-16)
  (15, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'React Hooks', 'useState, useEffect, useCallback, useMemo', 9, '1.9.15', 15, false, false, NOW() - INTERVAL '20 days', NOW()),
  (16, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'React Server Components', 'RSC and streaming', 9, '1.9.16', 16, false, false, NOW() - INTERVAL '5 days', NOW()),

  -- Mathematics subtopics (ids 17-19)
  (17, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Linear Algebra', 'Vectors, matrices, transformations', 2, '2.17', 17, false, false, NOW() - INTERVAL '40 days', NOW()),
  (18, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Calculus', 'Derivatives and integrals', 2, '2.18', 18, false, false, NOW() - INTERVAL '60 days', NOW()),
  (19, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Probability', 'Probability theory and distributions', 2, '2.19', 19, false, false, NOW() - INTERVAL '12 days', NOW()),

  -- Spanish subtopics (ids 20-22)
  (20, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Spanish Vocabulary', 'Common words and phrases', 3, '3.20', 20, false, false, NOW() - INTERVAL '10 days', NOW()),
  (21, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Spanish Grammar', 'Verb conjugations and sentence structure', 3, '3.21', 21, false, false, NOW() - INTERVAL '8 days', NOW()),
  (22, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Ser vs Estar', 'When to use ser vs estar', 21, '3.21.22', 22, false, false, NOW() - INTERVAL '5 days', NOW()),

  -- Topic without SRS (reference material, id 23)
  (23, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Keyboard Shortcuts', 'VS Code and terminal shortcuts - reference only', NULL, '23', NULL, false, false, NOW() - INTERVAL '30 days', NOW());

-- Reset sequence
SELECT setval('topics_id_seq', (SELECT MAX(id) FROM topics));

-- ============================================================================
-- REVIEWS
-- ============================================================================
-- Note: Reviews still use topic_id directly (this is updated to use topic_reviews association in the migration)
INSERT INTO reviews (id, user_id, topic_id, description, notes, scheduled_at, completed_at, rating, stability_before, difficulty_before, state_before, step_before, stability_after, difficulty_after, state_after, step_after, inserted_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'user_01KGG4R8HZAV513662YE3DJ0A9', 12, 'Generic constraints practice', 'Still tricky with conditional types', '2026-01-16', '2026-01-16', 'hard', 3.0, 6.0, 'LEARNING', 1, 4.0, 6.5, 'LEARNING', 2, NOW() - INTERVAL '1 day', NOW()),
  (2, 'user_01KGG4R8HZAV513662YE3DJ0A9', 13, 'Type guard examples', 'Good recall', '2026-01-16', '2026-01-16', 'good', 12.0, 5.2, 'REVIEW', 0, 15.0, 5.0, 'REVIEW', 0, NOW() - INTERVAL '1 day', NOW()),
  (3, 'user_01KGG4R8HZAV513662YE3DJ0A9', 14, 'Utility types quiz', 'Forgot Omit vs Exclude', '2026-01-16', '2026-01-16', 'miss', 10.0, 6.5, 'REVIEW', 0, 2.0, 7.0, 'RELEARNING', 1, NOW() - INTERVAL '1 day', NOW()),
  (4, 'user_01KGG4R8HZAV513662YE3DJ0A9', 20, 'Vocabulary flashcards', '50 new words', '2026-01-17', '2026-01-17', 'good', 3.0, 4.8, 'LEARNING', 1, 4.0, 4.5, 'LEARNING', 2, NOW() - INTERVAL '12 hours', NOW()),
  (5, 'user_01KGG4R8HZAV513662YE3DJ0A9', 21, 'Conjugation drills', 'Present tense solid', '2026-01-17', '2026-01-17', 'good', 2.5, 6.2, 'LEARNING', 2, 3.0, 6.0, 'LEARNING', 3, NOW() - INTERVAL '12 hours', NOW()),
  (6, 'user_01KGG4R8HZAV513662YE3DJ0A9', 22, 'Ser vs Estar exercises', 'Context clues helping', '2026-01-17', '2026-01-17', 'hard', 1.5, 7.2, 'LEARNING', 3, 2.0, 7.0, 'LEARNING', 4, NOW() - INTERVAL '12 hours', NOW()),
  (7, 'user_01KGG4R8HZAV513662YE3DJ0A9', 10, 'SQL joins review', 'LEFT vs INNER joins', '2026-01-15', '2026-01-15', 'good', 6.0, 5.2, 'LEARNING', 0, 8.0, 5.0, 'LEARNING', 1, NOW() - INTERVAL '2 days', NOW()),
  (8, 'user_01KGG4R8HZAV513662YE3DJ0A9', 9, 'React rendering', 'Virtual DOM concepts', '2026-01-15', '2026-01-15', 'easy', 15.0, 4.8, 'REVIEW', 0, 20.0, 4.5, 'REVIEW', 0, NOW() - INTERVAL '2 days', NOW()),
  (9, 'user_01KGG4R8HZAV513662YE3DJ0A9', 15, 'useEffect cleanup', 'Dependencies array', '2026-01-15', '2026-01-15', 'good', 14.0, 4.2, 'REVIEW', 0, 18.0, 4.0, 'REVIEW', 0, NOW() - INTERVAL '2 days', NOW()),
  (10, 'user_01KGG4R8HZAV513662YE3DJ0A9', 17, 'Matrix operations', '', '2026-01-18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day', NOW()),
  (11, 'user_01KGG4R8HZAV513662YE3DJ0A9', 19, 'Bayes theorem', '', '2026-01-18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day', NOW()),
  (12, 'user_01KGG4R8HZAV513662YE3DJ0A9', 16, 'RSC streaming patterns', '', '2026-01-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '6 hours', NOW()),
  (13, 'user_01KGG4R8HZAV513662YE3DJ0A9', 7, 'TypeScript basics', 'Type annotations', '2026-01-14', '2026-01-14', 'easy', 20.0, 3.2, 'REVIEW', 0, 25.0, 3.0, 'REVIEW', 0, NOW() - INTERVAL '3 days', NOW()),
  (14, 'user_01KGG4R8HZAV513662YE3DJ0A9', 8, 'Python comprehensions', 'List and dict comprehensions', '2026-01-12', '2026-01-12', 'good', 35.0, 2.7, 'REVIEW', 0, 40.0, 2.5, 'REVIEW', 0, NOW() - INTERVAL '5 days', NOW()),
  (15, 'user_01KGG4R8HZAV513662YE3DJ0A9', 11, 'Git rebasing', 'Interactive rebase', '2026-01-01', '2026-01-01', 'good', 55.0, 2.2, 'REVIEW', 0, 60.0, 2.0, 'REVIEW', 0, NOW() - INTERVAL '16 days', NOW()),
  (16, 'user_01KGG4R8HZAV513662YE3DJ0A9', 1, 'Programming overview', 'Big picture review', '2026-01-15', '2026-01-15', 'easy', 40.0, 3.7, 'REVIEW', 0, 45.0, 3.5, 'REVIEW', 0, NOW() - INTERVAL '2 days', NOW()),
  (17, 'user_01KGG4R8HZAV513662YE3DJ0A9', 18, 'Integration techniques', 'U-substitution', '2026-01-05', '2026-01-05', 'hard', 30.0, 6.2, 'REVIEW', 0, 35.0, 6.0, 'REVIEW', 0, NOW() - INTERVAL '12 days', NOW()),
  (18, 'user_01KGG4R8HZAV513662YE3DJ0A9', 17, 'Eigenvalues', 'Computation and meaning', '2026-01-08', '2026-01-08', 'good', 22.0, 5.7, 'REVIEW', 0, 25.0, 5.5, 'REVIEW', 0, NOW() - INTERVAL '9 days', NOW()),
  (19, 'user_01KGG4R8HZAV513662YE3DJ0A9', 2, 'Math foundations', 'Number theory basics', '2026-01-10', '2026-01-10', 'good', 27.0, 4.2, 'REVIEW', 0, 30.0, 4.0, 'REVIEW', 0, NOW() - INTERVAL '7 days', NOW()),
  (20, 'user_01KGG4R8HZAV513662YE3DJ0A9', 3, 'Spanish listening', 'Podcast comprehension', '2026-01-16', '2026-01-16', 'hard', 4.0, 5.8, 'LEARNING', 1, 5.0, 5.5, 'LEARNING', 2, NOW() - INTERVAL '1 day', NOW()),
  (21, 'user_01KGG4R8HZAV513662YE3DJ0A9', 19, 'Probability distributions', 'Normal and binomial', '2026-01-14', '2026-01-14', 'good', 5.0, 6.7, 'LEARNING', 1, 6.0, 6.5, 'LEARNING', 2, NOW() - INTERVAL '3 days', NOW()),
  (22, 'user_01KGG4R8HZAV513662YE3DJ0A9', 16, 'RSC basics', 'Server vs client components', '2026-01-16', '2026-01-16', 'hard', 2.0, 7.8, 'LEARNING', 2, 3.0, 7.5, 'LEARNING', 3, NOW() - INTERVAL '1 day', NOW()),
  (23, 'user_01KGG4R8HZAV513662YE3DJ0A9', 12, 'Generic inference', '', '2026-01-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  (24, 'user_01KGG4R8HZAV513662YE3DJ0A9', 14, 'Utility types retry', '', '2026-01-18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  (25, 'user_01KGG4R8HZAV513662YE3DJ0A9', 22, 'Ser vs Estar practice', '', '2026-01-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW());

-- Reset sequence
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));

-- ============================================================================
-- SOURCES
-- ============================================================================
-- Sample sources representing learning materials

-- Create FSRS states for sources
INSERT INTO fsrs_states (id, stability, difficulty, state, step, last_reviewed_at, srs_enabled, inherited_stability, inherited_difficulty, inherited_state, inherited_step, inherited_last_review)
OVERRIDING SYSTEM VALUE
VALUES
  -- Effective TypeScript (book, id=100)
  (100, 30.0, 4.0, 'REVIEW', 0, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  -- Chapter 1: Getting to Know TypeScript (id=101)
  (101, 45.0, 3.0, 'REVIEW', 0, '2026-01-10', true, 30.0, 4.0, 'REVIEW', 0, '2026-01-14'),
  -- Chapter 2: TypeScript's Type System (id=102)
  (102, 20.0, 5.0, 'REVIEW', 0, '2026-01-16', true, 30.0, 4.0, 'REVIEW', 0, '2026-01-14'),
  -- React Documentation (id=103)
  (103, 25.0, 3.5, 'REVIEW', 0, '2026-01-12', true, NULL, NULL, NULL, NULL, NULL),
  -- Python Crash Course (book, id=104)
  (104, 50.0, 2.5, 'REVIEW', 0, '2026-01-08', true, NULL, NULL, NULL, NULL, NULL),
  -- Spanish Learning Podcast (id=105) - inboxed
  (105, NULL, NULL, 'LEARNING', 0, NULL, true, NULL, NULL, NULL, NULL, NULL),
  -- Algorithm Design Manual (archived, id=106)
  (106, 15.0, 6.0, 'REVIEW', 0, '2025-11-15', true, NULL, NULL, NULL, NULL, NULL);

-- Reset sequence for FSRS states
SELECT setval('fsrs_states_id_seq', (SELECT MAX(id) FROM fsrs_states));

-- Insert sources
INSERT INTO sources (id, user_id, title, notes, parent_id, path, fsrs_state_id, archived, inboxed, inserted_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  -- Effective TypeScript (root source - a book)
  (1, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Effective TypeScript', '62 Specific Ways to Improve Your TypeScript by Dan Vanderkam', NULL, '1', 100, false, false, NOW() - INTERVAL '30 days', NOW()),

  -- Chapter 1 (child of Effective TypeScript)
  (2, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Chapter 1: Getting to Know TypeScript', 'Introduction to TypeScript and its relationship with JavaScript', 1, '1.2', 101, false, false, NOW() - INTERVAL '28 days', NOW()),

  -- Chapter 2 (child of Effective TypeScript)
  (3, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Chapter 2: TypeScript''s Type System', 'Deep dive into the type system', 1, '1.3', 102, false, false, NOW() - INTERVAL '20 days', NOW()),

  -- React Documentation (root source)
  (4, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'React Documentation', 'Official React documentation - react.dev', NULL, '4', 103, false, false, NOW() - INTERVAL '25 days', NOW()),

  -- Python Crash Course (root source - a book)
  (5, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Python Crash Course', 'A Hands-On, Project-Based Introduction to Programming', NULL, '5', 104, false, false, NOW() - INTERVAL '60 days', NOW()),

  -- Spanish Learning Podcast (inboxed - new source)
  (6, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Spanish Learning Podcast', 'Need to evaluate and organize', NULL, '6', 105, false, true, NOW() - INTERVAL '2 days', NOW()),

  -- Algorithm Design Manual (archived)
  (7, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Algorithm Design Manual', 'Steven Skiena - decided to use different resource', NULL, '7', 106, true, false, NOW() - INTERVAL '90 days', NOW());

-- Reset sequence
SELECT setval('sources_id_seq', (SELECT MAX(id) FROM sources));

-- ============================================================================
-- SOURCE_TOPICS (which topics each source covers)
-- ============================================================================
INSERT INTO source_topics (source_id, topic_id) VALUES
  -- Effective TypeScript covers TypeScript and its subtopics
  (1, 7),   -- Effective TypeScript covers TypeScript
  (2, 7),   -- Chapter 1 covers TypeScript basics
  (3, 7),   -- Chapter 2 covers TypeScript
  (3, 12),  -- Chapter 2 specifically covers Generics
  (3, 13),  -- Chapter 2 covers Type Guards
  (3, 14),  -- Chapter 2 covers Utility Types

  -- React Documentation covers React topics
  (4, 9),   -- React Documentation covers React
  (4, 15),  -- React Documentation covers React Hooks
  (4, 16),  -- React Documentation covers React Server Components

  -- Python Crash Course covers Python
  (5, 8),   -- Python Crash Course covers Python

  -- Spanish Podcast covers Spanish
  (6, 3),   -- Spanish Podcast covers Spanish
  (6, 20),  -- Spanish Podcast covers Spanish Vocabulary

  -- Algorithm Design Manual covered Math topics (archived)
  (7, 2),   -- Algorithm Design Manual covers Mathematics
  (7, 17);  -- Algorithm Design Manual covers Linear Algebra

-- ============================================================================
-- ENTITY RELATIONS (non-hierarchical relations between entities)
-- ============================================================================
-- Topic → Topic relations
INSERT INTO entity_relations (from_topic_id, to_topic_id) VALUES
  (12, 13),  -- Generics relates to Type Guards (both advanced TS)
  (17, 19),  -- Linear Algebra relates to Probability (math foundations)
  (8, 10),   -- Python relates to SQL (data work)
  (15, 7);   -- React Hooks relates to TypeScript (typed hooks)

-- Topic → Source relations
INSERT INTO entity_relations (from_topic_id, to_source_id) VALUES
  (7, 1);    -- TypeScript topic relates to Effective TypeScript book

-- Source → Topic relations
INSERT INTO entity_relations (from_source_id, to_topic_id) VALUES
  (4, 15);   -- React Documentation relates to React Hooks topic

-- ============================================================================
-- SOURCE PREREQUISITES
-- ============================================================================
INSERT INTO source_prerequisites (source_id, prereq_topic_id) VALUES
  (3, 7);    -- Chapter 2 requires TypeScript knowledge

INSERT INTO source_prerequisites (source_id, prereq_source_id) VALUES
  (3, 2);    -- Chapter 2 requires Chapter 1

-- ============================================================================
-- ADDITIONAL ROOT TOPICS (to fill MyLibraryPage)
-- ============================================================================

-- FSRS states for new root topics (IDs 24-53)
INSERT INTO fsrs_states (id, stability, difficulty, state, step, last_reviewed_at, srs_enabled, inherited_stability, inherited_difficulty, inherited_state, inherited_step, inherited_last_review)
OVERRIDING SYSTEM VALUE
VALUES
  (24, 35.0, 3.0, 'REVIEW', 0, '2026-01-12', true, NULL, NULL, NULL, NULL, NULL),
  (25, 20.0, 4.5, 'REVIEW', 0, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  (26, 15.0, 5.0, 'REVIEW', 0, '2026-01-10', true, NULL, NULL, NULL, NULL, NULL),
  (27, 50.0, 2.5, 'REVIEW', 0, '2026-01-15', true, NULL, NULL, NULL, NULL, NULL),
  (28, 45.0, 3.0, 'REVIEW', 0, '2026-01-13', true, NULL, NULL, NULL, NULL, NULL),
  (29, 10.0, 6.0, 'LEARNING', 2, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  (30, 22.0, 4.0, 'REVIEW', 0, '2026-01-11', true, NULL, NULL, NULL, NULL, NULL),
  (31, 18.0, 5.5, 'REVIEW', 0, '2026-01-09', true, NULL, NULL, NULL, NULL, NULL),
  (32, 8.0, 6.0, 'LEARNING', 1, '2026-01-15', true, NULL, NULL, NULL, NULL, NULL),
  (33, 12.0, 4.5, 'REVIEW', 0, '2026-01-13', true, NULL, NULL, NULL, NULL, NULL),
  (34, 5.0, 7.0, 'LEARNING', 3, '2026-01-17', true, NULL, NULL, NULL, NULL, NULL),
  (35, 6.0, 6.5, 'LEARNING', 2, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  (36, 40.0, 3.5, 'REVIEW', 0, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  (37, 55.0, 2.0, 'REVIEW', 0, '2026-01-08', true, NULL, NULL, NULL, NULL, NULL),
  (38, 28.0, 4.0, 'REVIEW', 0, '2026-01-12', true, NULL, NULL, NULL, NULL, NULL),
  (39, 14.0, 5.0, 'REVIEW', 0, '2026-01-15', true, NULL, NULL, NULL, NULL, NULL),
  (40, 32.0, 3.5, 'REVIEW', 0, '2026-01-10', true, NULL, NULL, NULL, NULL, NULL),
  (41, 7.0, 6.5, 'LEARNING', 2, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  (42, 3.0, 7.5, 'LEARNING', 3, '2026-01-17', true, NULL, NULL, NULL, NULL, NULL),
  (43, 30.0, 4.0, 'REVIEW', 0, '2026-01-11', true, NULL, NULL, NULL, NULL, NULL),
  (44, 25.0, 5.0, 'REVIEW', 0, '2026-01-09', true, NULL, NULL, NULL, NULL, NULL),
  (45, 20.0, 5.5, 'REVIEW', 0, '2026-01-07', true, NULL, NULL, NULL, NULL, NULL),
  (46, 16.0, 4.5, 'REVIEW', 0, '2026-01-13', true, NULL, NULL, NULL, NULL, NULL),
  (47, 10.0, 6.0, 'LEARNING', 1, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  (48, 9.0, 5.5, 'LEARNING', 1, '2026-01-15', true, NULL, NULL, NULL, NULL, NULL),
  (49, 12.0, 4.0, 'REVIEW', 0, '2026-01-12', true, NULL, NULL, NULL, NULL, NULL),
  (50, 8.0, 5.0, 'LEARNING', 1, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  (51, 18.0, 4.5, 'REVIEW', 0, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  (52, 22.0, 3.5, 'REVIEW', 0, '2026-01-11', true, NULL, NULL, NULL, NULL, NULL),
  (53, 4.0, 6.0, 'LEARNING', 2, '2026-01-17', true, NULL, NULL, NULL, NULL, NULL);

SELECT setval('fsrs_states_id_seq', (SELECT MAX(id) FROM fsrs_states));

INSERT INTO topics (id, user_id, name, notes, parent_id, path, fsrs_state_id, archived, inboxed, inserted_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  (24, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Machine Learning', 'Neural networks, training, and model evaluation', NULL, '24', 24, false, false, NOW() - INTERVAL '55 days', NOW() - INTERVAL '2 days'),
  (25, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Docker', 'Containers, images, and Docker Compose', NULL, '25', 25, false, false, NOW() - INTERVAL '40 days', NOW() - INTERVAL '3 days'),
  (26, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'AWS Cloud', 'EC2, S3, Lambda, and cloud architecture', NULL, '26', 26, false, false, NOW() - INTERVAL '35 days', NOW() - INTERVAL '5 days'),
  (27, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Data Structures', 'Arrays, trees, graphs, hash maps', NULL, '27', 27, false, false, NOW() - INTERVAL '70 days', NOW() - INTERVAL '1 day'),
  (28, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Algorithms', 'Sorting, searching, dynamic programming', NULL, '28', 28, false, false, NOW() - INTERVAL '65 days', NOW() - INTERVAL '4 days'),
  (29, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'System Design', 'Distributed systems and architecture patterns', NULL, '29', 29, false, false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
  (30, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Networking', 'TCP/IP, HTTP, DNS, and protocols', NULL, '30', 30, false, false, NOW() - INTERVAL '50 days', NOW() - INTERVAL '6 days'),
  (31, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Operating Systems', 'Processes, memory, file systems', NULL, '31', 31, false, false, NOW() - INTERVAL '45 days', NOW() - INTERVAL '8 days'),
  (32, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Cybersecurity', 'Network security, encryption, OWASP', NULL, '32', 32, false, false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),
  (33, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'DevOps', 'CI/CD pipelines and infrastructure as code', NULL, '33', 33, false, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '4 days'),
  (34, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Rust', 'Ownership, borrowing, and systems programming', NULL, '34', 34, false, false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
  (35, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Go', 'Goroutines, channels, and Go idioms', NULL, '35', 35, false, false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),
  (36, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'C++', 'Modern C++ features and memory management', NULL, '36', 36, false, false, NOW() - INTERVAL '80 days', NOW() - INTERVAL '3 days'),
  (37, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Java', 'JVM, Spring Boot, and enterprise patterns', NULL, '37', 37, false, false, NOW() - INTERVAL '90 days', NOW() - INTERVAL '9 days'),
  (38, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Design Patterns', 'GoF patterns and modern alternatives', NULL, '38', 38, false, false, NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days'),
  (39, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Microservices', 'Service mesh, event-driven architecture', NULL, '39', 39, false, false, NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days'),
  (40, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Database Design', 'Normalization, indexing, query optimization', NULL, '40', 40, false, false, NOW() - INTERVAL '55 days', NOW() - INTERVAL '7 days'),
  (41, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Computer Vision', 'Image recognition, CNNs, OpenCV', NULL, '41', 41, false, false, NOW() - INTERVAL '18 days', NOW() - INTERVAL '1 day'),
  (42, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Natural Language Processing', 'Transformers, embeddings, text classification', NULL, '42', 42, false, false, NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 day'),
  (43, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Statistics', 'Hypothesis testing, regression, Bayesian methods', NULL, '43', 43, false, false, NOW() - INTERVAL '40 days', NOW() - INTERVAL '6 days'),
  (44, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Physics', 'Classical mechanics and electromagnetism', NULL, '44', 44, false, false, NOW() - INTERVAL '50 days', NOW() - INTERVAL '8 days'),
  (45, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Chemistry', 'Organic chemistry and molecular structures', NULL, '45', 45, false, false, NOW() - INTERVAL '35 days', NOW() - INTERVAL '10 days'),
  (46, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Economics', 'Micro and macroeconomics fundamentals', NULL, '46', 46, false, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '4 days'),
  (47, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Philosophy', 'Logic, ethics, and epistemology', NULL, '47', 47, false, false, NOW() - INTERVAL '22 days', NOW() - INTERVAL '3 days'),
  (48, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Music Theory', 'Scales, chords, harmony, and composition', NULL, '48', 48, false, false, NOW() - INTERVAL '16 days', NOW() - INTERVAL '2 days'),
  (49, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Creative Writing', 'Fiction techniques, character development', NULL, '49', 49, false, false, NOW() - INTERVAL '28 days', NOW() - INTERVAL '5 days'),
  (50, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Public Speaking', 'Presentation skills and rhetoric', NULL, '50', 50, false, false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
  (51, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'UI/UX Design', 'User research, wireframing, design systems', NULL, '51', 51, false, false, NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),
  (52, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Project Management', 'Agile, Scrum, and team coordination', NULL, '52', 52, false, false, NOW() - INTERVAL '35 days', NOW() - INTERVAL '6 days'),
  (53, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Japanese', 'Hiragana, katakana, kanji, and grammar', NULL, '53', 53, false, false, NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day');

SELECT setval('topics_id_seq', (SELECT MAX(id) FROM topics));

-- ============================================================================
-- ADDITIONAL ROOT SOURCES (to fill MyLibraryPage)
-- ============================================================================

INSERT INTO fsrs_states (id, stability, difficulty, state, step, last_reviewed_at, srs_enabled, inherited_stability, inherited_difficulty, inherited_state, inherited_step, inherited_last_review)
OVERRIDING SYSTEM VALUE
VALUES
  (107, 40.0, 3.0, 'REVIEW', 0, '2026-01-12', true, NULL, NULL, NULL, NULL, NULL),
  (108, 20.0, 5.0, 'REVIEW', 0, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  (109, 55.0, 2.5, 'REVIEW', 0, '2026-01-08', true, NULL, NULL, NULL, NULL, NULL),
  (110, 35.0, 4.0, 'REVIEW', 0, '2026-01-10', true, NULL, NULL, NULL, NULL, NULL),
  (111, 30.0, 4.5, 'REVIEW', 0, '2026-01-11', true, NULL, NULL, NULL, NULL, NULL),
  (112, 18.0, 5.5, 'REVIEW', 0, '2026-01-13', true, NULL, NULL, NULL, NULL, NULL),
  (113, 25.0, 3.5, 'REVIEW', 0, '2026-01-15', true, NULL, NULL, NULL, NULL, NULL),
  (114, 10.0, 6.0, 'LEARNING', 2, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  (115, 8.0, 6.5, 'LEARNING', 1, '2026-01-15', true, NULL, NULL, NULL, NULL, NULL),
  (116, 6.0, 7.0, 'LEARNING', 2, '2026-01-17', true, NULL, NULL, NULL, NULL, NULL),
  (117, 45.0, 3.0, 'REVIEW', 0, '2026-01-09', true, NULL, NULL, NULL, NULL, NULL),
  (118, 12.0, 5.0, 'REVIEW', 0, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  (119, 15.0, 4.5, 'REVIEW', 0, '2026-01-12', true, NULL, NULL, NULL, NULL, NULL),
  (120, 28.0, 3.5, 'REVIEW', 0, '2026-01-10', true, NULL, NULL, NULL, NULL, NULL),
  (121, 22.0, 4.0, 'REVIEW', 0, '2026-01-13', true, NULL, NULL, NULL, NULL, NULL);

SELECT setval('fsrs_states_id_seq', (SELECT MAX(id) FROM fsrs_states));

INSERT INTO sources (id, user_id, title, notes, parent_id, path, fsrs_state_id, archived, inboxed, inserted_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  (8, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Clean Code', 'A Handbook of Agile Software Craftsmanship by Robert C. Martin', NULL, '8', 107, false, false, NOW() - INTERVAL '75 days', NOW() - INTERVAL '5 days'),
  (9, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Designing Data-Intensive Applications', 'Martin Kleppmann - distributed systems and data storage', NULL, '9', 108, false, false, NOW() - INTERVAL '40 days', NOW() - INTERVAL '3 days'),
  (10, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'The Pragmatic Programmer', 'David Thomas and Andrew Hunt - software craftsmanship', NULL, '10', 109, false, false, NOW() - INTERVAL '85 days', NOW() - INTERVAL '9 days'),
  (11, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Structure and Interpretation of Computer Programs', 'Abelson and Sussman - CS fundamentals', NULL, '11', 110, false, false, NOW() - INTERVAL '60 days', NOW() - INTERVAL '7 days'),
  (12, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Introduction to Algorithms (CLRS)', 'Cormen et al. - comprehensive algorithms reference', NULL, '12', 111, false, false, NOW() - INTERVAL '70 days', NOW() - INTERVAL '6 days'),
  (13, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Operating Systems: Three Easy Pieces', 'Remzi Arpaci-Dusseau - virtualization, concurrency, persistence', NULL, '13', 112, false, false, NOW() - INTERVAL '45 days', NOW() - INTERVAL '4 days'),
  (14, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Computer Networking: A Top-Down Approach', 'Kurose and Ross - networking fundamentals', NULL, '14', 113, false, false, NOW() - INTERVAL '50 days', NOW() - INTERVAL '2 days'),
  (15, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Deep Learning', 'Goodfellow, Bengio, Courville - neural networks and deep learning', NULL, '15', 114, false, false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
  (16, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'The Rust Programming Language', 'Official Rust book - ownership and systems programming', NULL, '16', 115, false, false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),
  (17, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Go by Example', 'Hands-on introduction to Go with annotated examples', NULL, '17', 116, false, false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
  (18, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Head First Design Patterns', 'Freeman and Robson - design patterns with visual explanations', NULL, '18', 117, false, false, NOW() - INTERVAL '65 days', NOW() - INTERVAL '8 days'),
  (19, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'The Art of Public Speaking', 'Stephen Lucas - presentation and communication skills', NULL, '19', 118, false, false, NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),
  (20, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Music Theory for Beginners', 'Leonard Vogler - fundamentals of music theory', NULL, '20', 119, false, false, NOW() - INTERVAL '18 days', NOW() - INTERVAL '5 days'),
  (21, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'MDN Web Docs', 'Mozilla Developer Network - web platform reference', NULL, '21', 120, false, false, NOW() - INTERVAL '55 days', NOW() - INTERVAL '7 days'),
  (22, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Kubernetes Documentation', 'Official Kubernetes docs - container orchestration', NULL, '22', 121, false, false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days');

SELECT setval('sources_id_seq', (SELECT MAX(id) FROM sources));

-- Link new sources to relevant topics
INSERT INTO source_topics (source_id, topic_id) VALUES
  (8, 38),   -- Clean Code covers Design Patterns
  (9, 29),   -- DDIA covers System Design
  (9, 40),   -- DDIA covers Database Design
  (10, 38),  -- Pragmatic Programmer covers Design Patterns
  (11, 27),  -- SICP covers Data Structures
  (11, 28),  -- SICP covers Algorithms
  (12, 28),  -- CLRS covers Algorithms
  (12, 27),  -- CLRS covers Data Structures
  (13, 31),  -- OSTEP covers Operating Systems
  (14, 30),  -- Networking book covers Networking
  (15, 24),  -- Deep Learning covers Machine Learning
  (15, 41),  -- Deep Learning covers Computer Vision
  (15, 42),  -- Deep Learning covers NLP
  (16, 34),  -- Rust book covers Rust
  (17, 35),  -- Go by Example covers Go
  (18, 38),  -- Head First covers Design Patterns
  (19, 50),  -- Art of Public Speaking covers Public Speaking
  (20, 48),  -- Music Theory book covers Music Theory
  (21, 7),   -- MDN covers TypeScript (web docs)
  (22, 25);  -- K8s docs covers Docker (container tech)

-- ============================================================================
-- PRACTICES (to fill MyLibraryPage)
-- ============================================================================

INSERT INTO fsrs_states (id, stability, difficulty, state, step, last_reviewed_at, srs_enabled, inherited_stability, inherited_difficulty, inherited_state, inherited_step, inherited_last_review)
OVERRIDING SYSTEM VALUE
VALUES
  (200, 30.0, 3.5, 'REVIEW', 0, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  (201, 15.0, 5.0, 'REVIEW', 0, '2026-01-15', true, NULL, NULL, NULL, NULL, NULL),
  (202, 25.0, 4.0, 'REVIEW', 0, '2026-01-12', true, NULL, NULL, NULL, NULL, NULL),
  (203, 20.0, 4.5, 'REVIEW', 0, '2026-01-13', true, NULL, NULL, NULL, NULL, NULL),
  (204, 10.0, 5.5, 'LEARNING', 1, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL),
  (205, 35.0, 3.0, 'REVIEW', 0, '2026-01-11', true, NULL, NULL, NULL, NULL, NULL),
  (206, 8.0, 6.0, 'LEARNING', 2, '2026-01-17', true, NULL, NULL, NULL, NULL, NULL),
  (207, 40.0, 2.5, 'REVIEW', 0, '2026-01-10', true, NULL, NULL, NULL, NULL, NULL),
  (208, 12.0, 5.0, 'REVIEW', 0, '2026-01-14', true, NULL, NULL, NULL, NULL, NULL),
  (209, 5.0, 6.5, 'LEARNING', 2, '2026-01-16', true, NULL, NULL, NULL, NULL, NULL);

SELECT setval('fsrs_states_id_seq', (SELECT MAX(id) FROM fsrs_states));

INSERT INTO practices (id, user_id, prompt, answer, fsrs_state_id, archived, inboxed, inserted_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'What is the time complexity of binary search?', 'O(log n) - halves the search space each iteration', 200, false, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '3 days'),
  (2, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Explain the difference between a stack and a queue', 'Stack: LIFO (Last In First Out). Queue: FIFO (First In First Out).', 201, false, false, NOW() - INTERVAL '28 days', NOW() - INTERVAL '2 days'),
  (3, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'What are the SOLID principles?', 'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion', 202, false, false, NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days'),
  (4, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Describe the observer pattern', 'A subject maintains a list of dependents (observers) and notifies them of state changes automatically.', 203, false, false, NOW() - INTERVAL '22 days', NOW() - INTERVAL '4 days'),
  (5, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'What is a closure in JavaScript?', 'A function that retains access to its lexical scope even when executed outside that scope.', 204, false, false, NOW() - INTERVAL '18 days', NOW() - INTERVAL '1 day'),
  (6, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Explain TCP vs UDP', 'TCP: reliable, ordered, connection-oriented. UDP: unreliable, unordered, connectionless, lower latency.', 205, false, false, NOW() - INTERVAL '35 days', NOW() - INTERVAL '6 days'),
  (7, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'What is the CAP theorem?', 'A distributed system can only guarantee two of three: Consistency, Availability, Partition tolerance.', 206, false, false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
  (8, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'How does Git use a directed acyclic graph?', 'Each commit points to its parent(s), forming a DAG. Branches are pointers to commits, merges create nodes with multiple parents.', 207, false, false, NOW() - INTERVAL '40 days', NOW() - INTERVAL '7 days'),
  (9, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'What is dependency injection?', 'A design pattern where dependencies are provided to a class rather than created internally, enabling loose coupling and testability.', 208, false, false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
  (10, 'user_01KGG4R8HZAV513662YE3DJ0A9', 'Explain the difference between a process and a thread', 'Process: independent execution unit with own memory space. Thread: lightweight unit within a process sharing its memory space.', 209, false, false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days');

SELECT setval('practices_id_seq', (SELECT MAX(id) FROM practices));

-- Link practices to topics
INSERT INTO practice_topics (practice_id, topic_id) VALUES
  (1, 28),   -- Binary search → Algorithms
  (2, 27),   -- Stack vs Queue → Data Structures
  (3, 38),   -- SOLID → Design Patterns
  (4, 38),   -- Observer → Design Patterns
  (5, 7),    -- Closures → TypeScript
  (6, 30),   -- TCP vs UDP → Networking
  (7, 29),   -- CAP theorem → System Design
  (8, 11),   -- Git DAG → Git
  (9, 38),   -- DI → Design Patterns
  (10, 31);  -- Process vs Thread → Operating Systems
