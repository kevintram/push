-- Seed data for local development
-- User ID: user_01K7HCZNMJF6XN0M78QMN7TDDX

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
  (1, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Programming', 'Software development concepts and languages', NULL, '1', 1, false, false, NOW() - INTERVAL '60 days', NOW()),

  -- Mathematics (will be id 2)
  (2, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Mathematics', 'Mathematical foundations', NULL, '2', 2, false, false, NOW() - INTERVAL '45 days', NOW()),

  -- Spanish (will be id 3)
  (3, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Spanish', 'Learning Spanish language', NULL, '3', 3, false, false, NOW() - INTERVAL '14 days', NOW()),

  -- Archived topic (will be id 4)
  (4, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Ruby on Rails', 'Decided to focus on other frameworks', NULL, '4', 4, true, false, NOW() - INTERVAL '90 days', NOW()),

  -- Inboxed topics (newly added, not yet organized) (ids 5, 6)
  (5, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Kubernetes', 'Container orchestration - need to learn', NULL, '5', 5, false, true, NOW() - INTERVAL '2 days', NOW()),
  (6, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'GraphQL', 'API query language', NULL, '6', 6, false, true, NOW() - INTERVAL '1 day', NOW()),

  -- Programming subtopics (ids 7-11)
  -- TypeScript (child of Programming)
  (7, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'TypeScript', 'Type-safe JavaScript', 1, '1.7', 7, false, false, NOW() - INTERVAL '30 days', NOW()),

  -- Python (child of Programming)
  (8, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Python', 'Python programming language', 1, '1.8', 8, false, false, NOW() - INTERVAL '50 days', NOW()),

  -- React (child of Programming)
  (9, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'React', 'React framework and hooks', 1, '1.9', 9, false, false, NOW() - INTERVAL '25 days', NOW()),

  -- SQL (child of Programming)
  (10, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'SQL', 'Database queries and design', 1, '1.10', 10, false, false, NOW() - INTERVAL '10 days', NOW()),

  -- Git (child of Programming)
  (11, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Git', 'Version control with Git', 1, '1.11', 11, false, false, NOW() - INTERVAL '80 days', NOW()),

  -- TypeScript subtopics (grandchildren of Programming, ids 12-14)
  (12, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Generics', 'TypeScript generic types and constraints', 7, '1.7.12', 12, false, false, NOW() - INTERVAL '7 days', NOW()),
  (13, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Type Guards', 'Narrowing types with type guards', 7, '1.7.13', 13, false, false, NOW() - INTERVAL '14 days', NOW()),
  (14, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Utility Types', 'Partial, Required, Pick, Omit, etc.', 7, '1.7.14', 14, false, false, NOW() - INTERVAL '20 days', NOW()),

  -- React subtopics (ids 15-16)
  (15, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'React Hooks', 'useState, useEffect, useCallback, useMemo', 9, '1.9.15', 15, false, false, NOW() - INTERVAL '20 days', NOW()),
  (16, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'React Server Components', 'RSC and streaming', 9, '1.9.16', 16, false, false, NOW() - INTERVAL '5 days', NOW()),

  -- Mathematics subtopics (ids 17-19)
  (17, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Linear Algebra', 'Vectors, matrices, transformations', 2, '2.17', 17, false, false, NOW() - INTERVAL '40 days', NOW()),
  (18, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Calculus', 'Derivatives and integrals', 2, '2.18', 18, false, false, NOW() - INTERVAL '60 days', NOW()),
  (19, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Probability', 'Probability theory and distributions', 2, '2.19', 19, false, false, NOW() - INTERVAL '12 days', NOW()),

  -- Spanish subtopics (ids 20-22)
  (20, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Spanish Vocabulary', 'Common words and phrases', 3, '3.20', 20, false, false, NOW() - INTERVAL '10 days', NOW()),
  (21, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Spanish Grammar', 'Verb conjugations and sentence structure', 3, '3.21', 21, false, false, NOW() - INTERVAL '8 days', NOW()),
  (22, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Ser vs Estar', 'When to use ser vs estar', 21, '3.21.22', 22, false, false, NOW() - INTERVAL '5 days', NOW()),

  -- Topic without SRS (reference material, id 23)
  (23, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Keyboard Shortcuts', 'VS Code and terminal shortcuts - reference only', NULL, '23', NULL, false, false, NOW() - INTERVAL '30 days', NOW());

-- Reset sequence
SELECT setval('topics_id_seq', (SELECT MAX(id) FROM topics));

-- ============================================================================
-- TOPIC OTHER RELATIONS (non-hierarchical)
-- ============================================================================
INSERT INTO topic_other_relations (from_topic_id, to_topic_id) VALUES
  (12, 13),  -- Generics relates to Type Guards (both advanced TS)
  (17, 19),  -- Linear Algebra relates to Probability (math foundations)
  (8, 10),   -- Python relates to SQL (data work)
  (15, 7);   -- React Hooks relates to TypeScript (typed hooks)

-- ============================================================================
-- REVIEW SESSIONS
-- ============================================================================
INSERT INTO review_sessions (id, user_id, description, scheduled_at, completed_at, inserted_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  -- Completed sessions (ids 1-3)
  (1, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Morning TypeScript review - focused on generics', '2026-01-16', '2026-01-16', NOW() - INTERVAL '1 day', NOW()),
  (2, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Spanish practice - verb conjugations', '2026-01-17', '2026-01-17', NOW() - INTERVAL '12 hours', NOW()),
  (3, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Programming catch-up - multiple topics', '2026-01-15', '2026-01-15', NOW() - INTERVAL '2 days', NOW()),

  -- Scheduled but not completed (ids 4-5)
  (4, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Math review - linear algebra and probability', '2026-01-18', NULL, NOW() - INTERVAL '1 day', NOW()),
  (5, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'React deep dive - server components focus', '2026-01-20', NULL, NOW() - INTERVAL '6 hours', NOW());

-- Reset sequence (sequence keeps original name 'reviews_id_seq' even after table rename)
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM review_sessions));

-- ============================================================================
-- REVIEWS
-- ============================================================================
-- Note: Reviews still use topic_id directly (this is updated to use topic_reviews association in the migration)
-- Review session IDs: 1=TS review, 2=Spanish, 3=Programming, 4=Math, 5=React

-- Reviews from session 1 (TypeScript review - completed)
INSERT INTO reviews (id, user_id, topic_id, review_session_id, description, notes, scheduled_at, completed_at, rating, stability_before, difficulty_before, state_before, step_before, stability_after, difficulty_after, state_after, step_after, inserted_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 12, 1, 'Generic constraints practice', 'Still tricky with conditional types', '2026-01-16', '2026-01-16', 'hard', 3.0, 6.0, 'LEARNING', 1, 4.0, 6.5, 'LEARNING', 2, NOW() - INTERVAL '1 day', NOW()),
  (2, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 13, 1, 'Type guard examples', 'Good recall', '2026-01-16', '2026-01-16', 'good', 12.0, 5.2, 'REVIEW', 0, 15.0, 5.0, 'REVIEW', 0, NOW() - INTERVAL '1 day', NOW()),
  (3, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 14, 1, 'Utility types quiz', 'Forgot Omit vs Exclude', '2026-01-16', '2026-01-16', 'miss', 10.0, 6.5, 'REVIEW', 0, 2.0, 7.0, 'RELEARNING', 1, NOW() - INTERVAL '1 day', NOW()),

  -- Reviews from session 2 (Spanish practice - completed)
  (4, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 20, 2, 'Vocabulary flashcards', '50 new words', '2026-01-17', '2026-01-17', 'good', 3.0, 4.8, 'LEARNING', 1, 4.0, 4.5, 'LEARNING', 2, NOW() - INTERVAL '12 hours', NOW()),
  (5, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 21, 2, 'Conjugation drills', 'Present tense solid', '2026-01-17', '2026-01-17', 'good', 2.5, 6.2, 'LEARNING', 2, 3.0, 6.0, 'LEARNING', 3, NOW() - INTERVAL '12 hours', NOW()),
  (6, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 22, 2, 'Ser vs Estar exercises', 'Context clues helping', '2026-01-17', '2026-01-17', 'hard', 1.5, 7.2, 'LEARNING', 3, 2.0, 7.0, 'LEARNING', 4, NOW() - INTERVAL '12 hours', NOW()),

  -- Reviews from session 3 (Programming catch-up - completed)
  (7, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 10, 3, 'SQL joins review', 'LEFT vs INNER joins', '2026-01-15', '2026-01-15', 'good', 6.0, 5.2, 'LEARNING', 0, 8.0, 5.0, 'LEARNING', 1, NOW() - INTERVAL '2 days', NOW()),
  (8, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 9, 3, 'React rendering', 'Virtual DOM concepts', '2026-01-15', '2026-01-15', 'easy', 15.0, 4.8, 'REVIEW', 0, 20.0, 4.5, 'REVIEW', 0, NOW() - INTERVAL '2 days', NOW()),
  (9, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 15, 3, 'useEffect cleanup', 'Dependencies array', '2026-01-15', '2026-01-15', 'good', 14.0, 4.2, 'REVIEW', 0, 18.0, 4.0, 'REVIEW', 0, NOW() - INTERVAL '2 days', NOW()),

  -- Reviews for session 4 (Math review - scheduled, not completed)
  (10, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 17, 4, 'Matrix operations', '', '2026-01-18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day', NOW()),
  (11, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 19, 4, 'Bayes theorem', '', '2026-01-18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day', NOW()),

  -- Reviews for session 5 (React deep dive - scheduled, not completed)
  (12, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 16, 5, 'RSC streaming patterns', '', '2026-01-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '6 hours', NOW()),

  -- Standalone reviews (not part of a session)
  -- Historical completed reviews
  (13, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 7, NULL, 'TypeScript basics', 'Type annotations', '2026-01-14', '2026-01-14', 'easy', 20.0, 3.2, 'REVIEW', 0, 25.0, 3.0, 'REVIEW', 0, NOW() - INTERVAL '3 days', NOW()),
  (14, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 8, NULL, 'Python comprehensions', 'List and dict comprehensions', '2026-01-12', '2026-01-12', 'good', 35.0, 2.7, 'REVIEW', 0, 40.0, 2.5, 'REVIEW', 0, NOW() - INTERVAL '5 days', NOW()),
  (15, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 11, NULL, 'Git rebasing', 'Interactive rebase', '2026-01-01', '2026-01-01', 'good', 55.0, 2.2, 'REVIEW', 0, 60.0, 2.0, 'REVIEW', 0, NOW() - INTERVAL '16 days', NOW()),
  (16, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 1, NULL, 'Programming overview', 'Big picture review', '2026-01-15', '2026-01-15', 'easy', 40.0, 3.7, 'REVIEW', 0, 45.0, 3.5, 'REVIEW', 0, NOW() - INTERVAL '2 days', NOW()),
  (17, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 18, NULL, 'Integration techniques', 'U-substitution', '2026-01-05', '2026-01-05', 'hard', 30.0, 6.2, 'REVIEW', 0, 35.0, 6.0, 'REVIEW', 0, NOW() - INTERVAL '12 days', NOW()),
  (18, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 17, NULL, 'Eigenvalues', 'Computation and meaning', '2026-01-08', '2026-01-08', 'good', 22.0, 5.7, 'REVIEW', 0, 25.0, 5.5, 'REVIEW', 0, NOW() - INTERVAL '9 days', NOW()),
  (19, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 2, NULL, 'Math foundations', 'Number theory basics', '2026-01-10', '2026-01-10', 'good', 27.0, 4.2, 'REVIEW', 0, 30.0, 4.0, 'REVIEW', 0, NOW() - INTERVAL '7 days', NOW()),
  (20, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 3, NULL, 'Spanish listening', 'Podcast comprehension', '2026-01-16', '2026-01-16', 'hard', 4.0, 5.8, 'LEARNING', 1, 5.0, 5.5, 'LEARNING', 2, NOW() - INTERVAL '1 day', NOW()),
  (21, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 19, NULL, 'Probability distributions', 'Normal and binomial', '2026-01-14', '2026-01-14', 'good', 5.0, 6.7, 'LEARNING', 1, 6.0, 6.5, 'LEARNING', 2, NOW() - INTERVAL '3 days', NOW()),
  (22, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 16, NULL, 'RSC basics', 'Server vs client components', '2026-01-16', '2026-01-16', 'hard', 2.0, 7.8, 'LEARNING', 2, 3.0, 7.5, 'LEARNING', 3, NOW() - INTERVAL '1 day', NOW()),

  -- Future scheduled reviews (standalone)
  (23, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 12, NULL, 'Generic inference', '', '2026-01-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  (24, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 14, NULL, 'Utility types retry', '', '2026-01-18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  (25, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 22, NULL, 'Ser vs Estar practice', '', '2026-01-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW());

-- Reset sequence
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));

-- ============================================================================
-- TOPIC_REVIEWS (association table for polymorphic reviews)
-- ============================================================================
-- Populate topic_reviews from existing reviews
INSERT INTO topic_reviews (review_id, topic_id)
SELECT id, topic_id FROM reviews WHERE topic_id IS NOT NULL;

-- ============================================================================
-- SOURCES (Phase 2)
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
  (1, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Effective TypeScript', '62 Specific Ways to Improve Your TypeScript by Dan Vanderkam', NULL, '1', 100, false, false, NOW() - INTERVAL '30 days', NOW()),

  -- Chapter 1 (child of Effective TypeScript)
  (2, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Chapter 1: Getting to Know TypeScript', 'Introduction to TypeScript and its relationship with JavaScript', 1, '1.2', 101, false, false, NOW() - INTERVAL '28 days', NOW()),

  -- Chapter 2 (child of Effective TypeScript)
  (3, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Chapter 2: TypeScript''s Type System', 'Deep dive into the type system', 1, '1.3', 102, false, false, NOW() - INTERVAL '20 days', NOW()),

  -- React Documentation (root source)
  (4, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'React Documentation', 'Official React documentation - react.dev', NULL, '4', 103, false, false, NOW() - INTERVAL '25 days', NOW()),

  -- Python Crash Course (root source - a book)
  (5, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Python Crash Course', 'A Hands-On, Project-Based Introduction to Programming', NULL, '5', 104, false, false, NOW() - INTERVAL '60 days', NOW()),

  -- Spanish Learning Podcast (inboxed - new source)
  (6, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Spanish Learning Podcast', 'Need to evaluate and organize', NULL, '6', 105, false, true, NOW() - INTERVAL '2 days', NOW()),

  -- Algorithm Design Manual (archived)
  (7, 'user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Algorithm Design Manual', 'Steven Skiena - decided to use different resource', NULL, '7', 106, true, false, NOW() - INTERVAL '90 days', NOW());

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
