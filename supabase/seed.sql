-- Seed data for local development
-- User ID: user_01K7HCZNMJF6XN0M78QMN7TDDX

-- ============================================================================
-- TOPICS
-- ============================================================================
-- A mix of programming, math, and language learning topics with various states

-- Root-level topics (no parents)
INSERT INTO topics (user_id, name, notes, state, archived, inboxed, srs_enabled, stability, difficulty, step, last_reviewed_at, inserted_at, updated_at)
VALUES
  -- Programming (parent topic) - will be id 1
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Programming', 'Software development concepts and languages', 'REVIEW', false, false, true, 45.0, 3.5, 0, '2026-01-15', NOW() - INTERVAL '60 days', NOW()),

  -- Mathematics (parent topic) - will be id 2
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Mathematics', 'Mathematical foundations', 'REVIEW', false, false, true, 30.0, 4.0, 0, '2026-01-10', NOW() - INTERVAL '45 days', NOW()),

  -- Spanish (parent topic) - will be id 3
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Spanish', 'Learning Spanish language', 'LEARNING', false, false, true, 5.0, 5.5, 2, '2026-01-16', NOW() - INTERVAL '14 days', NOW()),

  -- Archived topic - will be id 4
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Ruby on Rails', 'Decided to focus on other frameworks', 'REVIEW', true, false, true, 20.0, 4.0, 0, '2025-12-01', NOW() - INTERVAL '90 days', NOW()),

  -- Inboxed topics (newly added, not yet organized) - will be ids 5, 6
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Kubernetes', 'Container orchestration - need to learn', 'LEARNING', false, true, true, NULL, NULL, 0, NULL, NOW() - INTERVAL '2 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'GraphQL', 'API query language', 'LEARNING', false, true, true, NULL, NULL, 0, NULL, NOW() - INTERVAL '1 day', NOW()),

  -- Programming subtopics - will be ids 7-11
  -- TypeScript (child of Programming)
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'TypeScript', 'Type-safe JavaScript', 'REVIEW', false, false, true, 25.0, 3.0, 0, '2026-01-14', NOW() - INTERVAL '30 days', NOW()),

  -- Python (child of Programming)
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Python', 'Python programming language', 'REVIEW', false, false, true, 40.0, 2.5, 0, '2026-01-12', NOW() - INTERVAL '50 days', NOW()),

  -- React (child of Programming)
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'React', 'React framework and hooks', 'REVIEW', false, false, true, 20.0, 4.5, 0, '2026-01-16', NOW() - INTERVAL '25 days', NOW()),

  -- SQL (child of Programming)
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'SQL', 'Database queries and design', 'LEARNING', false, false, true, 8.0, 5.0, 1, '2026-01-15', NOW() - INTERVAL '10 days', NOW()),

  -- Git (child of Programming)
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Git', 'Version control with Git', 'REVIEW', false, false, true, 60.0, 2.0, 0, '2026-01-01', NOW() - INTERVAL '80 days', NOW()),

  -- TypeScript subtopics (grandchildren of Programming) - will be ids 12-14
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Generics', 'TypeScript generic types and constraints', 'LEARNING', false, false, true, 4.0, 6.5, 2, '2026-01-16', NOW() - INTERVAL '7 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Type Guards', 'Narrowing types with type guards', 'REVIEW', false, false, true, 15.0, 5.0, 0, '2026-01-10', NOW() - INTERVAL '14 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Utility Types', 'Partial, Required, Pick, Omit, etc.', 'RELEARNING', false, false, true, 2.0, 7.0, 1, '2026-01-17', NOW() - INTERVAL '20 days', NOW()),

  -- React subtopics - will be ids 15-16
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'React Hooks', 'useState, useEffect, useCallback, useMemo', 'REVIEW', false, false, true, 18.0, 4.0, 0, '2026-01-13', NOW() - INTERVAL '20 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'React Server Components', 'RSC and streaming', 'LEARNING', false, false, true, 3.0, 7.5, 3, '2026-01-16', NOW() - INTERVAL '5 days', NOW()),

  -- Mathematics subtopics - will be ids 17-19
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Linear Algebra', 'Vectors, matrices, transformations', 'REVIEW', false, false, true, 25.0, 5.5, 0, '2026-01-08', NOW() - INTERVAL '40 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Calculus', 'Derivatives and integrals', 'REVIEW', false, false, true, 35.0, 6.0, 0, '2026-01-05', NOW() - INTERVAL '60 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Probability', 'Probability theory and distributions', 'LEARNING', false, false, true, 6.0, 6.5, 2, '2026-01-14', NOW() - INTERVAL '12 days', NOW()),

  -- Spanish subtopics - will be ids 20-22
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Spanish Vocabulary', 'Common words and phrases', 'LEARNING', false, false, true, 4.0, 4.5, 2, '2026-01-16', NOW() - INTERVAL '10 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Spanish Grammar', 'Verb conjugations and sentence structure', 'LEARNING', false, false, true, 3.0, 6.0, 3, '2026-01-17', NOW() - INTERVAL '8 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Ser vs Estar', 'When to use ser vs estar', 'LEARNING', false, false, true, 2.0, 7.0, 4, '2026-01-17', NOW() - INTERVAL '5 days', NOW()),

  -- Topic without SRS (reference material) - will be id 23
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Keyboard Shortcuts', 'VS Code and terminal shortcuts - reference only', 'REVIEW', false, false, false, NULL, NULL, NULL, NULL, NOW() - INTERVAL '30 days', NOW());

-- ============================================================================
-- TOPIC RELATIONSHIPS (via topics_closure)
-- ============================================================================
-- Note: Reflexive paths (depth=0) are auto-created by trigger
-- Topic IDs: 1=Programming, 2=Math, 3=Spanish, 4=RoR, 5=K8s, 6=GraphQL,
--            7=TypeScript, 8=Python, 9=React, 10=SQL, 11=Git,
--            12=Generics, 13=TypeGuards, 14=UtilityTypes,
--            15=ReactHooks, 16=RSC, 17=LinAlg, 18=Calc, 19=Prob,
--            20=SpanishVocab, 21=SpanishGrammar, 22=SerEstar, 23=Shortcuts

-- Programming -> children (depth 1)
INSERT INTO topics_closure (ancestor, descendant, depth, count) VALUES
  (1, 7, 1, 1),   -- Programming -> TypeScript
  (1, 8, 1, 1),   -- Programming -> Python
  (1, 9, 1, 1),   -- Programming -> React
  (1, 10, 1, 1),  -- Programming -> SQL
  (1, 11, 1, 1);  -- Programming -> Git

-- TypeScript -> children (depth 1)
INSERT INTO topics_closure (ancestor, descendant, depth, count) VALUES
  (7, 12, 1, 1),  -- TypeScript -> Generics
  (7, 13, 1, 1),  -- TypeScript -> Type Guards
  (7, 14, 1, 1);  -- TypeScript -> Utility Types

-- Programming -> TypeScript grandchildren (depth 2)
INSERT INTO topics_closure (ancestor, descendant, depth, count) VALUES
  (1, 12, 2, 1),  -- Programming -> Generics
  (1, 13, 2, 1),  -- Programming -> Type Guards
  (1, 14, 2, 1);  -- Programming -> Utility Types

-- React -> children (depth 1)
INSERT INTO topics_closure (ancestor, descendant, depth, count) VALUES
  (9, 15, 1, 1),  -- React -> React Hooks
  (9, 16, 1, 1);  -- React -> React Server Components

-- Programming -> React grandchildren (depth 2)
INSERT INTO topics_closure (ancestor, descendant, depth, count) VALUES
  (1, 15, 2, 1),  -- Programming -> React Hooks
  (1, 16, 2, 1);  -- Programming -> React Server Components

-- Mathematics -> children (depth 1)
INSERT INTO topics_closure (ancestor, descendant, depth, count) VALUES
  (2, 17, 1, 1),  -- Mathematics -> Linear Algebra
  (2, 18, 1, 1),  -- Mathematics -> Calculus
  (2, 19, 1, 1);  -- Mathematics -> Probability

-- Spanish -> children (depth 1)
INSERT INTO topics_closure (ancestor, descendant, depth, count) VALUES
  (3, 20, 1, 1),  -- Spanish -> Spanish Vocabulary
  (3, 21, 1, 1);  -- Spanish -> Spanish Grammar

-- Spanish Grammar -> children (depth 1)
INSERT INTO topics_closure (ancestor, descendant, depth, count) VALUES
  (21, 22, 1, 1);  -- Spanish Grammar -> Ser vs Estar

-- Spanish -> Ser vs Estar (depth 2)
INSERT INTO topics_closure (ancestor, descendant, depth, count) VALUES
  (3, 22, 2, 1);  -- Spanish -> Ser vs Estar

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
INSERT INTO review_sessions (user_id, description, scheduled_at, completed_at, inserted_at, updated_at)
VALUES
  -- Completed sessions (will be ids 1-3)
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Morning TypeScript review - focused on generics', '2026-01-16', '2026-01-16', NOW() - INTERVAL '1 day', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Spanish practice - verb conjugations', '2026-01-17', '2026-01-17', NOW() - INTERVAL '12 hours', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Programming catch-up - multiple topics', '2026-01-15', '2026-01-15', NOW() - INTERVAL '2 days', NOW()),

  -- Scheduled but not completed (will be ids 4-5)
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'Math review - linear algebra and probability', '2026-01-18', NULL, NOW() - INTERVAL '1 day', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 'React deep dive - server components focus', '2026-01-20', NULL, NOW() - INTERVAL '6 hours', NOW());

-- ============================================================================
-- REVIEWS
-- ============================================================================
-- Review session IDs: 1=TS review, 2=Spanish, 3=Programming, 4=Math, 5=React

-- Reviews from session 1 (TypeScript review - completed)
INSERT INTO reviews (user_id, topic_id, review_session_id, description, notes, scheduled_at, completed_at, rating, stability_before, difficulty_before, state_before, step_before, stability_after, difficulty_after, state_after, step_after, inserted_at, updated_at)
VALUES
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 12, 1, 'Generic constraints practice', 'Still tricky with conditional types', '2026-01-16', '2026-01-16', 'hard', 3.0, 6.0, 'LEARNING', 1, 4.0, 6.5, 'LEARNING', 2, NOW() - INTERVAL '1 day', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 13, 1, 'Type guard examples', 'Good recall', '2026-01-16', '2026-01-16', 'good', 12.0, 5.2, 'REVIEW', 0, 15.0, 5.0, 'REVIEW', 0, NOW() - INTERVAL '1 day', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 14, 1, 'Utility types quiz', 'Forgot Omit vs Exclude', '2026-01-16', '2026-01-16', 'miss', 10.0, 6.5, 'REVIEW', 0, 2.0, 7.0, 'RELEARNING', 1, NOW() - INTERVAL '1 day', NOW());

-- Reviews from session 2 (Spanish practice - completed)
INSERT INTO reviews (user_id, topic_id, review_session_id, description, notes, scheduled_at, completed_at, rating, stability_before, difficulty_before, state_before, step_before, stability_after, difficulty_after, state_after, step_after, inserted_at, updated_at)
VALUES
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 20, 2, 'Vocabulary flashcards', '50 new words', '2026-01-17', '2026-01-17', 'good', 3.0, 4.8, 'LEARNING', 1, 4.0, 4.5, 'LEARNING', 2, NOW() - INTERVAL '12 hours', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 21, 2, 'Conjugation drills', 'Present tense solid', '2026-01-17', '2026-01-17', 'good', 2.5, 6.2, 'LEARNING', 2, 3.0, 6.0, 'LEARNING', 3, NOW() - INTERVAL '12 hours', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 22, 2, 'Ser vs Estar exercises', 'Context clues helping', '2026-01-17', '2026-01-17', 'hard', 1.5, 7.2, 'LEARNING', 3, 2.0, 7.0, 'LEARNING', 4, NOW() - INTERVAL '12 hours', NOW());

-- Reviews from session 3 (Programming catch-up - completed)
INSERT INTO reviews (user_id, topic_id, review_session_id, description, notes, scheduled_at, completed_at, rating, stability_before, difficulty_before, state_before, step_before, stability_after, difficulty_after, state_after, step_after, inserted_at, updated_at)
VALUES
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 10, 3, 'SQL joins review', 'LEFT vs INNER joins', '2026-01-15', '2026-01-15', 'good', 6.0, 5.2, 'LEARNING', 0, 8.0, 5.0, 'LEARNING', 1, NOW() - INTERVAL '2 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 9, 3, 'React rendering', 'Virtual DOM concepts', '2026-01-15', '2026-01-15', 'easy', 15.0, 4.8, 'REVIEW', 0, 20.0, 4.5, 'REVIEW', 0, NOW() - INTERVAL '2 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 15, 3, 'useEffect cleanup', 'Dependencies array', '2026-01-15', '2026-01-15', 'good', 14.0, 4.2, 'REVIEW', 0, 18.0, 4.0, 'REVIEW', 0, NOW() - INTERVAL '2 days', NOW());

-- Reviews for session 4 (Math review - scheduled, not completed)
INSERT INTO reviews (user_id, topic_id, review_session_id, description, notes, scheduled_at, completed_at, rating, inserted_at, updated_at)
VALUES
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 17, 4, 'Matrix operations', '', '2026-01-18', NULL, NULL, NOW() - INTERVAL '1 day', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 19, 4, 'Bayes theorem', '', '2026-01-18', NULL, NULL, NOW() - INTERVAL '1 day', NOW());

-- Reviews for session 5 (React deep dive - scheduled, not completed)
INSERT INTO reviews (user_id, topic_id, review_session_id, description, notes, scheduled_at, completed_at, rating, inserted_at, updated_at)
VALUES
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 16, 5, 'RSC streaming patterns', '', '2026-01-20', NULL, NULL, NOW() - INTERVAL '6 hours', NOW());

-- Standalone reviews (not part of a session)
INSERT INTO reviews (user_id, topic_id, review_session_id, description, notes, scheduled_at, completed_at, rating, stability_before, difficulty_before, state_before, step_before, stability_after, difficulty_after, state_after, step_after, inserted_at, updated_at)
VALUES
  -- Historical completed reviews
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 7, NULL, 'TypeScript basics', 'Type annotations', '2026-01-14', '2026-01-14', 'easy', 20.0, 3.2, 'REVIEW', 0, 25.0, 3.0, 'REVIEW', 0, NOW() - INTERVAL '3 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 8, NULL, 'Python comprehensions', 'List and dict comprehensions', '2026-01-12', '2026-01-12', 'good', 35.0, 2.7, 'REVIEW', 0, 40.0, 2.5, 'REVIEW', 0, NOW() - INTERVAL '5 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 11, NULL, 'Git rebasing', 'Interactive rebase', '2026-01-01', '2026-01-01', 'good', 55.0, 2.2, 'REVIEW', 0, 60.0, 2.0, 'REVIEW', 0, NOW() - INTERVAL '16 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 1, NULL, 'Programming overview', 'Big picture review', '2026-01-15', '2026-01-15', 'easy', 40.0, 3.7, 'REVIEW', 0, 45.0, 3.5, 'REVIEW', 0, NOW() - INTERVAL '2 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 18, NULL, 'Integration techniques', 'U-substitution', '2026-01-05', '2026-01-05', 'hard', 30.0, 6.2, 'REVIEW', 0, 35.0, 6.0, 'REVIEW', 0, NOW() - INTERVAL '12 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 17, NULL, 'Eigenvalues', 'Computation and meaning', '2026-01-08', '2026-01-08', 'good', 22.0, 5.7, 'REVIEW', 0, 25.0, 5.5, 'REVIEW', 0, NOW() - INTERVAL '9 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 2, NULL, 'Math foundations', 'Number theory basics', '2026-01-10', '2026-01-10', 'good', 27.0, 4.2, 'REVIEW', 0, 30.0, 4.0, 'REVIEW', 0, NOW() - INTERVAL '7 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 3, NULL, 'Spanish listening', 'Podcast comprehension', '2026-01-16', '2026-01-16', 'hard', 4.0, 5.8, 'LEARNING', 1, 5.0, 5.5, 'LEARNING', 2, NOW() - INTERVAL '1 day', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 19, NULL, 'Probability distributions', 'Normal and binomial', '2026-01-14', '2026-01-14', 'good', 5.0, 6.7, 'LEARNING', 1, 6.0, 6.5, 'LEARNING', 2, NOW() - INTERVAL '3 days', NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 16, NULL, 'RSC basics', 'Server vs client components', '2026-01-16', '2026-01-16', 'hard', 2.0, 7.8, 'LEARNING', 2, 3.0, 7.5, 'LEARNING', 3, NOW() - INTERVAL '1 day', NOW());

-- Future scheduled reviews (standalone)
INSERT INTO reviews (user_id, topic_id, review_session_id, description, notes, scheduled_at, completed_at, rating, inserted_at, updated_at)
VALUES
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 12, NULL, 'Generic inference', '', '2026-01-19', NULL, NULL, NOW(), NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 14, NULL, 'Utility types retry', '', '2026-01-18', NULL, NULL, NOW(), NOW()),
  ('user_01K7HCZNMJF6XN0M78QMN7TDDX', 22, NULL, 'Ser vs Estar practice', '', '2026-01-19', NULL, NULL, NOW(), NOW());
