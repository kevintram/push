# Flexible Model Refactor: Fine-Grained Commit Plan (52 Commits)

Edit: Implemented as 48 commits instead of 52.
Edit: Commit 3 (`feat(api): add Note, NoteTag, and NoteRelation ORM models`) included the full `apps/api/app/models/__init__.py` export cleanup instead of additive-only staging.
Edit: Commit 5 (`feat(api): implement notes REST API with tags and relations`) included full `apps/api/app/main.py` router transition (legacy router removals plus notes router addition).
Edit: Planned commits 16, 20, 21, and 22 were consolidated into one commit: `feat(web): add note detail routes and page` (full `NoteDetailPage.tsx` plus `/notes/$noteId` route files).
Edit: Planned commit 17 (`/notes` additive-only `routeTree.gen.ts` staging) was skipped; full generated route tree changes landed with commit 26 alongside legacy route deletions.
Edit: Commit 40 was narrowed to schema export cleanup in `apps/api/app/schemas/__init__.py`; `apps/api/app/models/__init__.py` was already cleaned in commit 3.

## Scope
This plan covers current changed files in this worktree across:
- `apps/api`
- `apps/web`
- `supabase`
- `docs/ephemeral/unified-notes-data-model-spec.md`

Goal: keep each commit easy to review, bisect, and roll back while minimizing red intermediate states.

## Workflow Guardrails
1. Run all commands from repo root.
2. Start each step with a clean index (`git status --short` should show no staged files).
3. Before every commit, verify staged scope:
```bash
git diff --cached --stat
```
4. Use `git add -A` for deletion-heavy commits.
5. Do not stage `__pycache__` files.
6. For partial staging commits, verify exact hunks:
```bash
git diff --cached
```
7. When running a checkpoint with unstaged future commits in the worktree, test only the staged snapshot:
```bash
git stash push --keep-index -u -m "checkpoint"
# run checkpoint command(s)
git stash pop
```
8. For generated files (for example `routeTree.gen.ts`), commit fully regenerated snapshots by default. Use partial staging only for an intentional compatibility bridge (commit 17 additive `/notes` typing before commit 26 legacy-route deletion snapshot).
9. For mixed add/remove files staged with `git add -p` (`apps/api/app/models/__init__.py`, `apps/api/app/main.py`, and `apps/web/src/app/routeTree.gen.ts`), use `s` (split) first; if still mixed, use `e` (manual patch edit) so only intended lines are staged.
10. For first partial staging of a new file, mark it intent-to-add before `git add -p`:
```bash
git add -N apps/web/src/app/pages/NoteDetailPage.tsx
```

## Commit Sequence

### 1) `docs: define unified notes data model spec`
```bash
git add docs/ephemeral/unified-notes-data-model-spec.md
git commit -m "$(cat <<'EOF'
docs: define unified notes data model spec

Design document for consolidating topics, sources, and practices into a
single notes table with capability tags. Covers schema design, relation
types (RELATED, PREREQUISITE, COVERS, ASSESSES), reading status lifecycle,
migration mapping from legacy entities, and API surface changes.
EOF
)"
```

### 2) `feat(db): add notes schema and migrate legacy entities`
```bash
git add supabase/migrations/20260220123000_unified_notes_model.sql
git commit -m "$(cat <<'EOF'
feat(db): add notes schema and migrate legacy entities

Creates notes, note_tags, and note_relations tables with ltree hierarchy.
Migrates existing topics, sources, and practices into unified notes with
appropriate tags. Converts all review foreign keys to note_id. Adds DB
triggers for relation tag rules and orphaned FSRS cleanup. Drops legacy
entity tables after migration.
EOF
)"
```

### 3) `feat(api): add Note, NoteTag, and NoteRelation ORM models`
```bash
git add apps/api/app/models/notes.py
# Stage only additive note exports in app.models for early compatibility.
# Keep legacy exports and removals for the later cleanup commit.
# Use `s`/`e` in patch mode so only Note* additions are staged.
git add -p apps/api/app/models/__init__.py
git diff --cached -- apps/api/app/models/__init__.py
git commit -m "$(cat <<'EOF'
feat(api): add Note, NoteTag, and NoteRelation ORM models

SQLAlchemy models for the unified notes schema. Note includes self-referential
tree hierarchy, FSRS state, reading status, and computed retrievability metrics.
NoteTag and NoteRelation handle capability tags and typed relations. Exports
added to app.models package.
EOF
)"
```

### 4) `feat(api): add Pydantic schemas for notes API`
```bash
git add apps/api/app/schemas/notes.py
git commit -m "$(cat <<'EOF'
feat(api): add Pydantic schemas for notes API

Request/response schemas for notes domain: NoteCreate, NoteRead, NoteUpdate,
tag operations, relation CRUD, and reading list management. Includes status
badge schema for freshness and due-date indicators.
EOF
)"
```

### 5) `feat(api): implement notes REST API with tags and relations`
```bash
git add apps/api/app/notes/__init__.py
git add apps/api/app/notes/router.py
git add apps/api/app/notes/service.py
git add apps/api/app/notes/status_badges.py
# Stage only note-router additions in main.py.
# Keep legacy router removals for commits 33/35/37.
# Use `s`/`e` in patch mode so commit 5 does not stage router removals.
git add -p apps/api/app/main.py
git diff --cached -- apps/api/app/main.py
git commit -m "$(cat <<'EOF'
feat(api): implement notes REST API with tags and relations

Full /notes router with CRUD, tag management, typed relations, and reading
list endpoints. Service layer handles ownership validation, cycle detection
for hierarchy, and tag-based relation rules (COVERS requires SOURCE->TOPIC,
ASSESSES requires PRACTICE->TOPIC|SOURCE). Includes status badge computation
for due dates and retrievability warnings.
EOF
)"
```

### 6) `refactor(api): point reviews at notes table with FSRS replay`
```bash
git add apps/api/app/models/reviews.py
git add apps/api/app/schemas/reviews.py
git add apps/api/app/reviews/service.py
git add apps/api/app/reviews/router.py
git commit -m "$(cat <<'EOF'
refactor(api): point reviews at notes table with FSRS replay

Updates Review model/schema to reference note_id instead of legacy entity
FKs. Service layer loads notes with eager-loaded FSRS state and replays
completed reviews to maintain stability/difficulty/step values. CRUD
operations trigger FSRS recalculation from the earliest affected date.
EOF
)"
```

### 7) `refactor(api): unify review queue over notes with due and hazy lanes`
```bash
git add apps/api/app/schemas/review_queue.py
git add apps/api/app/utils/retrievability.py
git add apps/api/app/review_queue/service.py
git add apps/api/app/review_queue/router.py
git commit -m "$(cat <<'EOF'
refactor(api): unify review queue over notes with due and hazy lanes

Replaces entity-specific queue items with note-based ReviewQueueItem.
Queue merges two lanes: (1) due reviews sorted by days_until_due,
(2) hazy notes sorted by days_until_hazy. Adds cursor pagination with
base64-encoded sort keys. Retrievability utils compute FSRS freshness
tiers (Fresh/Fine/Hazy/Forgotten) and threshold crossings.
EOF
)"
```

### 8) `refactor(api): unify search endpoint over notes with tag filtering`
```bash
git add apps/api/app/schemas/search.py
git add apps/api/app/search/service.py
git add apps/api/app/search/router.py
git commit -m "$(cat <<'EOF'
refactor(api): unify search endpoint over notes with tag filtering

Replaces separate topic/source/practice search endpoints with a single
/search/ endpoint querying notes. Supports ILIKE text matching on title
and body, entity_type filtering mapped to note tags (topic->TOPIC, etc.),
and inbox/archive filters. Results ordered by updated_at descending.
EOF
)"
```

### 9) `test(api): add integration tests for notes CRUD and hierarchy`
```bash
git add apps/api/tests/notes/test_notes.py
git add apps/api/tests/notes/test_note_tree.py
git commit -m "$(cat <<'EOF'
test(api): add integration tests for notes CRUD and hierarchy

Tests note creation with tags and reading status, list filtering by
in_reading_list, and COVERS relation tag validation. TestNoteTree
covers parent/child queries, cycle detection on parent assignment,
cascade behavior on delete, and reading list/status update endpoints.
EOF
)"
```

### 10) `test(api): add integration tests for relations and status badges`
```bash
git add apps/api/tests/notes/test_note_relations.py
git add apps/api/tests/notes/test_status_badges.py
git commit -m "$(cat <<'EOF'
test(api): add integration tests for relations and status badges

TestNoteRelations covers RELATED relation lifecycle, COVERS/ASSESSES tag
rules (SOURCE->TOPIC, PRACTICE->TOPIC|SOURCE), and tag removal protection
when relations depend on them. TestNoteStatusBadges verifies hazy_for,
forgotten_soon, and forgotten_for badge computation.
EOF
)"
```

### 11) `test(api): add review queue endpoint tests with pagination and status badges`
```bash
git add apps/api/tests/review_queue/__init__.py
git add apps/api/tests/review_queue/test_review_queue.py
git commit -m "$(cat <<'EOF'
test(api): add review queue endpoint tests with pagination and status badges

Integration tests covering due vs hazy queue item routing, cursor-based
pagination with limit boundaries, and status badge presence validation.
Includes 400 error case for malformed cursor parameters.
EOF
)"
```

### 12) `test(api): update reviews and search tests for note_id foreign keys`
```bash
git add apps/api/tests/reviews/test_reviews.py
git add apps/api/tests/search/test_search.py
git commit -m "$(cat <<'EOF'
test(api): update reviews and search tests for note_id foreign keys

Reviews tests: FSRS computation on completed reviews, note_id filtering,
cross-note reassignment, and legacy multi-target validation rejection.
Search tests: tag-filtered results via legacy entity_types param and
entity_types=note returning all note tags.
EOF
)"
```

### 13) `chore(db): replace legacy entity seeds with unified notes fixtures`
```bash
git add supabase/seed.sql
git commit -m "$(cat <<'EOF'
chore(db): replace legacy entity seeds with unified notes fixtures

Seeds notes with TOPIC, SOURCE, and PRACTICE tags including multi-tag
combinations. Adds note_relations (COVERS, RELATED, PREREQUISITE, ASSESSES),
FSRS states, hierarchical parent_id references, and completed reviews with
full stability transitions for local development.
EOF
)"
```

### 14) `feat(web): add notes feature types, schemas, API hooks, and constants`
```bash
git add apps/web/src/features/notes/api
git add apps/web/src/features/notes/types
git add apps/web/src/features/notes/constants
git add apps/web/src/features/notes/utils
git commit -m "$(cat <<'EOF'
feat(web): add notes feature types, schemas, API hooks, and constants

Types and Valibot schemas for Note, NoteTag, NoteRelation, status badges,
and reading status lifecycle. TanStack Query hooks for CRUD, tag updates,
and relation management. Constants for reading status icons/colors and tag
ordering. Includes status badge sort utility for due/hazy/forgotten display.
EOF
)"
```

### 15) `feat(web): add NoteCard component with flashcard mode and FSRS controls`
```bash
git add apps/web/src/features/notes/components/NoteCard.tsx
git add apps/web/src/utils/estimateCardSize.ts
git commit -m "$(cat <<'EOF'
feat(web): add NoteCard component with flashcard mode and FSRS controls

NoteCard displays title/body with search highlighting and flashcard-style
reveal toggles. Includes SRS enable/disable, inline review creation dropdown,
reading list status popover, freshness tier badge, and responsive metadata
(last reviewed, stability). Adds estimateCardSize utility for masonry layout
height estimation.
EOF
)"
```

### 16) `feat(web): add note detail route files`
```bash
git add 'apps/web/src/app/routes/_main/notes_.$noteId.tsx'
git add 'apps/web/src/app/routes/_main/notes_.$noteId.index.tsx'
# `NoteDetailPage.tsx` is new; mark intent-to-add so partial staging works.
git add -N apps/web/src/app/pages/NoteDetailPage.tsx
git add -p apps/web/src/app/pages/NoteDetailPage.tsx
git commit -m "$(cat <<'EOF'
feat(web): add note detail route files

Adds TanStack Router files for /notes/$noteId path: parent route provides
layout outlet, index route renders NoteDetailPage component. NoteDetailPage
content is staged incrementally across commits 16, 20, 21, and 22 via
partial staging.
EOF
)"
```

### 17) `feat(web): add /notes route entries to generated route tree`
```bash
# Stage only additive /notes route-tree hunks.
# Keep legacy-route removals for commit 26 so route deletions land with route-file deletions.
# Use `s`/`e` in patch mode if a hunk mixes additive `/notes` lines with legacy-route removals.
git add -p apps/web/src/app/routeTree.gen.ts
git diff --cached -- apps/web/src/app/routeTree.gen.ts
git commit -m "$(cat <<'EOF'
feat(web): add /notes route entries to generated route tree

Stages only additive hunks for /notes/$noteId route registration.
Legacy topic/source/practice route removals deferred to commit 26
alongside route file deletions.
EOF
)"
```

### 18) `feat(web): add note creation dialog and navigation hook`
```bash
git add apps/web/src/features/notes/components/AddNoteDialog.tsx
git add apps/web/src/hooks/useNoteNavigation.ts
git commit -m "$(cat <<'EOF'
feat(web): add note creation dialog and navigation hook

AddNoteDialog supports tag selection, title/body input, inline review
preview, reading list status, SRS inheritance toggle, and "create more"
mode for batch creation. useNoteNavigation wraps router navigation to
note detail pages.
EOF
)"
```

### 19) `feat(web): add reading status popover and add-entity menu`
```bash
git add apps/web/src/features/notes/components/NoteReadingStatusPopover.tsx
git add apps/web/src/components/ui/add-entity-menu.tsx
git add apps/web/src/components/ui/dropdown-menu.tsx
git commit -m "$(cat <<'EOF'
feat(web): add reading status popover and add-entity menu

NoteReadingStatusPopover manages reading list status (NEW, IN_PROGRESS,
DONE, PAUSED, DROPPED) with progress notes field. AddEntityMenu provides
reusable search/create dropdown pattern used across relation tabs.
Includes dropdown-menu base component updates.
EOF
)"
```

### 20) `feat(web): add note detail page queries and mutation handlers`
```bash
git add -p apps/web/src/app/pages/NoteDetailPage.tsx
git commit -m "$(cat <<'EOF'
feat(web): add note detail page queries and mutation handlers

Stages NoteDetailPage data layer: note/relation/review queries with
useQueries batching, relation ID extraction, and mutation handlers for
tag toggling, relation add/remove, parent assignment, and review
creation with toast feedback.
EOF
)"
```

### 21) `feat(web): add note detail relation panels and reviews tab`
```bash
git add -p apps/web/src/app/pages/NoteDetailPage.tsx
git commit -m "$(cat <<'EOF'
feat(web): add note detail relation panels and reviews tab

Implements NoteGrid component for displaying related notes in masonry
layout. Adds tabbed sections for contents (children), practice notes,
prerequisites, sources, topics covered, assesses, and related notes.
Reviews tab shows categorized review lists (overdue, today, upcoming,
completed) with inline rating creation. Includes search-add dialog
for linking existing notes via typed relations.
EOF
)"
```

### 22) `feat(web): complete note detail page with inline editing and action bar`
```bash
git add apps/web/src/app/pages/NoteDetailPage.tsx
git commit -m "$(cat <<'EOF'
feat(web): complete note detail page with inline editing and action bar

Adds tag management dropdown with multi-select for TOPIC/SOURCE/PRACTICE.
Implements inline title/body editing with auto-save on blur. Displays
status badges (hazy, forgotten) with tooltips. Adds action toolbar with
SRS toggle, reading list popover, inbox/archive toggles, and overflow
menu. Shows freshness tier, last reviewed date, and durability metrics.
EOF
)"
```

### 23) `refactor(web): update reviews feature to reference note_id`
```bash
git add apps/web/src/features/reviews/api
git add apps/web/src/features/reviews/types
git add apps/web/src/features/reviews/components/ReviewDialog.tsx
git add apps/web/src/features/reviews/components/ReviewItem.tsx
git add apps/web/src/features/reviews/hooks/useDetailReviewCounts.ts
git add apps/web/src/features/reviews/utils/reviewToastDescription.tsx
git add apps/web/src/features/reviews/utils/isOverdue.ts
git add apps/web/src/app/hooks/useReviewPageHandlers.ts
git add apps/web/src/hooks/useLearnableMetrics.ts
git commit -m "$(cat <<'EOF'
refactor(web): update reviews feature to reference note_id

Replaces entity-specific foreign keys (topic_id, source_id, practice_id)
with unified note_id in Review types and API calls. Updates ReviewDialog
to navigate to /notes/$noteId and ReviewItem to link to note detail.
Migrates useDetailReviewCounts to filter by noteId. Adds shared isOverdue
utility. Updates useLearnableMetrics to work with note-based FSRS fields.
EOF
)"
```

### 24) `refactor(web): update search to return notes with tag-based filtering`
```bash
git add apps/web/src/features/search/types/search.schemas.ts
git add apps/web/src/features/search/types/search.types.ts
git add apps/web/src/features/search/components/SearchDialog.tsx
git add apps/web/src/utils/groupByDate.ts
git commit -m "$(cat <<'EOF'
refactor(web): update search to return notes with tag-based filtering

SearchResultItem now wraps a Note object with entity_type='note'.
SearchDialog renders NoteCard components and filters by note tags
(TOPIC/SOURCE/PRACTICE) via EntityTypeFilter badges. Updates groupByDate
helper to extract notes from SearchResultItem for date-grouped views.
EOF
)"
```

### 25) `refactor(web): wire app shell to notes API and AddNoteDialog`
```bash
git add apps/web/src/app/components/AppSidebar/AppSidebar.tsx
git add apps/web/src/app/components/AppSidebar/CreateButton.tsx
git add apps/web/src/components/EntityTypeFilter.tsx
git add apps/web/src/app/routes/__root.tsx
git commit -m "$(cat <<'EOF'
refactor(web): wire app shell to notes API and AddNoteDialog

AppSidebar fetches inbox count via useNotes hook. CreateButton opens
AddNoteDialog instead of legacy entity dialogs. EntityTypeFilter badges
now map to note tags. Removes legacy entity providers from __root.tsx,
keeping only ReviewDialogProvider for note-aware review modals.
EOF
)"
```

### 26) `refactor(web): delete /topics, /sources, /practices routes`
```bash
git add -A apps/web/src/app/routes/_main
# Stage a full regenerated snapshot that removes legacy route-tree entries.
git add apps/web/src/app/routeTree.gen.ts
git commit -m "$(cat <<'EOF'
refactor(web): delete /topics, /sources, /practices routes

Removes 25 route files for legacy entity types: my-topics, topics/$id/*,
sources/$id/*, and practices/$id/* with all nested tabs. Regenerates
routeTree.gen.ts to drop corresponding imports and type definitions.
The /notes/$noteId routes added in commit 17 now serve all entity detail views.
EOF
)"
```

### 27) `refactor(web): rewrite InboxPage with useNotes and NoteCard`
```bash
git add apps/web/src/app/pages/InboxPage.tsx
git commit -m "$(cat <<'EOF'
refactor(web): rewrite InboxPage with useNotes and NoteCard

Replaces topic-based inbox with unified notes query (inboxed=true).
Uses NoteCard in masonry layout with tag-based filtering (TOPIC/SOURCE/
PRACTICE). AddNoteDialog creates notes directly instead of legacy topics.
EOF
)"
```

### 28) `refactor(web): rewrite MyLibraryPage with useNotes and NoteCard`
```bash
git add apps/web/src/app/pages/MyLibraryPage.tsx
git commit -m "$(cat <<'EOF'
refactor(web): rewrite MyLibraryPage with useNotes and NoteCard

Queries root-level non-archived, non-inboxed notes instead of legacy
topics. Displays notes in masonry layout with tag filtering and empty
state prompting creation via AddNoteDialog.
EOF
)"
```

### 29) `refactor(web): rewrite ReadPage with note reading status buckets`
```bash
git add apps/web/src/app/pages/ReadPage.tsx
git commit -m "$(cat <<'EOF'
refactor(web): rewrite ReadPage with note reading status buckets

Queries notes with in_reading_list=true and buckets by reading_status
(NEW, IN_PROGRESS, ON_HOLD, FINISHED). Tab navigation switches between
active reads, on-hold, and finished sections. Each section renders
NoteCard in masonry layout with tag filtering.
EOF
)"
```

### 30) `refactor(web): rewrite RecentPage with searchAll returning notes`
```bash
git add apps/web/src/app/pages/RecentPage.tsx
git commit -m "$(cat <<'EOF'
refactor(web): rewrite RecentPage with searchAll returning notes

Uses unified search API to fetch recently updated notes, grouped by
date (Today, Yesterday, Nd ago). Renders NoteCard in masonry sections
with tag-based filtering. Removes legacy topic/source/practice result
type handling.
EOF
)"
```

### 31) `refactor(web): rewrite ReviewPage with note-based queue and unreviewed tab`
```bash
git add apps/web/src/app/pages/ReviewPage.tsx
git commit -m "$(cat <<'EOF'
refactor(web): rewrite ReviewPage with note-based queue and unreviewed tab

Due tab fetches infinite review queue (due + hazy lanes) grouped by week
offset. Unreviewed tab fetches notes with last_reviewed_at=null, grouped
by created date. Both tabs render NoteCard with status badges showing
overdue/hazy state. Removes legacy entity-specific queue item handling.
EOF
)"
```

### 32) `refactor(web): rewrite ArchivedPage with useNotes and NoteCard`
```bash
git add apps/web/src/app/pages/ArchivedPage.tsx
git commit -m "$(cat <<'EOF'
refactor(web): rewrite ArchivedPage with useNotes and NoteCard

Queries notes with archived=true. Renders in masonry layout with tag-
based filtering (TOPIC/SOURCE/PRACTICE/none). Replaces legacy topic-
based archive query.
EOF
)"
```

### 33) `refactor(api): delete /topics endpoints and service layer`
```bash
git add -A apps/api/app/topics
# Stage only topics import/include removals in main.py.
git add -p apps/api/app/main.py
git diff --cached -- apps/api/app/main.py
git commit -m "$(cat <<'EOF'
refactor(api): delete /topics endpoints and service layer

Removes topics router (~400 lines) with CRUD, hierarchy, search,
related topics, conversion, and topic-practice/topic-source linking
endpoints. Removes service layer with tree operations, relationship
validation, and entity conversion logic. Unregisters topics_router
from main app.
EOF
)"
```

### 34) `test(api): delete topics test suite`
```bash
git add -A apps/api/tests/topics
git commit -m "$(cat <<'EOF'
test(api): delete topics test suite

Removes test_crud (topic CRUD, flags, SRS state), test_tree (hierarchy,
cycle detection, parent assignment), and test_conversion (topic->source
and topic->practice conversions with relationship migration).
EOF
)"
```

### 35) `refactor(api): delete /sources endpoints and service layer`
```bash
git add -A apps/api/app/sources
# Stage only sources import/include removals in main.py.
git add -p apps/api/app/main.py
git diff --cached -- apps/api/app/main.py
git commit -m "$(cat <<'EOF'
refactor(api): delete /sources endpoints and service layer

Removes sources router (~400 lines) with CRUD, hierarchy, search,
prerequisites, conversion, and source-topic/source-practice linking
endpoints. Removes service layer with tree operations, prerequisite
ordering, and reading status transitions. Unregisters sources_router
from main app.
EOF
)"
```

### 36) `test(api): delete sources test suite`
```bash
git add -A apps/api/tests/sources
git commit -m "$(cat <<'EOF'
test(api): delete sources test suite

Removes test_crud (source CRUD, ownership filtering, flags), test_tree
(hierarchy operations, parent assignment, cycle detection), and
test_conversion (source->topic and source->practice conversions).
Functionality now covered by notes test suite.
EOF
)"
```

### 37) `refactor(api): delete /practices endpoints and service layer`
```bash
git add -A apps/api/app/practices
# Stage only practices import/include removals in main.py.
git add -p apps/api/app/main.py
git diff --cached -- apps/api/app/main.py
git commit -m "$(cat <<'EOF'
refactor(api): delete /practices endpoints and service layer

Removes practices router with CRUD, search, topic/source linking, and
conversion endpoints. Removes service layer handling FSRS inheritance,
topic/source relationship management, and practice-to-topic/source
conversions. Unregisters practices_router from main app.
EOF
)"
```

### 38) `test(api): delete practices test suite`
```bash
git add -A apps/api/tests/practices
git commit -m "$(cat <<'EOF'
test(api): delete practices test suite

Removes test_crud (practice CRUD, topic/source linking, ownership
validation) and test_conversion (practice->topic and practice->source
conversions with relationship migration). Functionality now covered
by notes test suite.
EOF
)"
```

### 39) `test(api): remove legacy entity fixtures from conftest`
```bash
git add apps/api/tests/conftest.py
git commit -m "$(cat <<'EOF'
test(api): remove legacy entity fixtures from conftest

Removes create_test_topic, create_test_source, and create_test_practice
fixture factories. Test database setup now only seeds note-based data.
Shared fixtures (db_session, test_client, mock_user_id) remain unchanged.
EOF
)"
```

### 40) `refactor(api): clean up models and schemas package exports`
```bash
git add apps/api/app/models/__init__.py
git add apps/api/app/schemas/__init__.py
git commit -m "$(cat <<'EOF'
refactor(api): clean up models and schemas package exports

Removes Topic, Source, Practice, and EntityRelation exports from
app.models. Removes legacy entity schemas from app.schemas. Package
__all__ lists now export only Note, NoteTag, NoteRelation, Review,
and their associated Pydantic schemas.
EOF
)"
```

### 41) `refactor(api): delete Topic model and schemas`
```bash
git add -A apps/api/app/models/topics.py
git add -A apps/api/app/schemas/topics.py
git commit -m "$(cat <<'EOF'
refactor(api): delete Topic model and schemas

Removes Topic SQLAlchemy model with self-referential hierarchy, FSRS
state relationship, and topic_topics/topic_sources/topic_practices
association tables. Removes TopicCreate, TopicRead, TopicUpdate, and
related Pydantic schemas. Topics now represented as notes with TOPIC tag.
EOF
)"
```

### 42) `refactor(api): delete Source model, schemas, and ConversionBlockedError`
```bash
git add -A apps/api/app/models/sources.py
git add -A apps/api/app/models/source_prerequisites.py
git add -A apps/api/app/schemas/sources.py
git add apps/api/app/exceptions.py
git commit -m "$(cat <<'EOF'
refactor(api): delete Source model, schemas, and ConversionBlockedError

Removes Source SQLAlchemy model with reading status, hierarchy, and
FSRS state. Removes SourcePrerequisite model for ordered prerequisite
chains. Removes SourceCreate, SourceRead, SourceUpdate schemas and
ReadingStatus enum. Removes ConversionBlockedError exception (entity
type conversions no longer needed with unified notes model).
EOF
)"
```

### 43) `refactor(api): delete Practice model and schemas`
```bash
git add -A apps/api/app/models/practices.py
git add -A apps/api/app/schemas/practices.py
git commit -m "$(cat <<'EOF'
refactor(api): delete Practice model and schemas

Removes Practice SQLAlchemy model with prompt/answer fields, FSRS state
relationship, and practice_topics/practice_sources association tables.
Removes PracticeCreate, PracticeRead, PracticeUpdate Pydantic schemas.
Practices now represented as notes with PRACTICE tag.
EOF
)"
```

### 44) `refactor(api): delete EntityRelation model, schemas, and tests`
```bash
git add -A apps/api/app/models/entity_relations.py
git add -A apps/api/app/schemas/entity_relations.py
git add -A apps/api/app/schemas/entity_summaries.py
git add -A apps/api/tests/entity_relations
git commit -m "$(cat <<'EOF'
refactor(api): delete EntityRelation model, schemas, and tests

Removes EntityRelation model supporting cross-entity-type relationships
(topic->source, source->practice, etc.) with polymorphic foreign keys.
Removes EntitySummary schemas for unified entity display. Removes
test_entity_relations integration tests. Cross-note relationships now
handled by NoteRelation with typed relation categories.
EOF
)"
```

### 45) `refactor(web): delete topic page components`
```bash
git add -A apps/web/src/app/pages/MyTopicsPage.tsx
git add -A apps/web/src/app/pages/TopicDetailPage.tsx
git add -A apps/web/src/app/pages/TopicReviewsPage.tsx
git commit -m "$(cat <<'EOF'
refactor(web): delete topic page components

Removes MyTopicsPage (root topic listing with masonry layout and
creation flow), TopicDetailPage (topic detail with tabbed sections
for children, sources, practices, and reviews), and TopicReviewsPage
(topic-scoped review history). Topics now viewed via NoteDetailPage.
EOF
)"
```

### 46) `refactor(web): delete SourceDetailPage and SourceReviewsPage`
```bash
git add -A apps/web/src/app/pages/SourceDetailPage.tsx
git add -A apps/web/src/app/pages/SourceReviewsPage.tsx
git commit -m "$(cat <<'EOF'
refactor(web): delete SourceDetailPage and SourceReviewsPage

Removes SourceDetailPage with tabbed sections (children, practice, topics,
prerequisites, related), conversion handlers, and cross-entity navigation.
Removes SourceReviewsPage with source-scoped review history. Sources now
viewed via NoteDetailPage with SOURCE tag.
EOF
)"
```

### 47) `refactor(web): delete PracticeDetailPage, PracticeReviewsPage, and EntityReviewsPageContent`
```bash
git add -A apps/web/src/app/pages/PracticeDetailPage.tsx
git add -A apps/web/src/app/pages/PracticeReviewsPage.tsx
git add -A apps/web/src/app/pages/EntityReviewsPageContent.tsx
git commit -m "$(cat <<'EOF'
refactor(web): delete PracticeDetailPage, PracticeReviewsPage, and EntityReviewsPageContent

Removes PracticeDetailPage with context provider, conversion handlers, and
topic/source navigation. Removes PracticeReviewsPage with practice-scoped
review history. Removes shared EntityReviewsPageContent that powered
entity-specific review tabs with categorized sections (overdue, today,
upcoming, completed). Practices now viewed via NoteDetailPage with PRACTICE tag.
EOF
)"
```

### 48) `refactor(web): delete topics, sources, and practices feature modules`
```bash
git add -A apps/web/src/features/topics
git add -A apps/web/src/features/sources
git add -A apps/web/src/features/practices
git commit -m "$(cat <<'EOF'
refactor(web): delete topics, sources, and practices feature modules

Removes three complete feature modules (~130 files total):
- topics/: API hooks (CRUD, search, relationships, conversions), TopicCard,
  TopicDetail with tabs, TopicDialog, relationship panels, stores, and types
- sources/: API hooks (CRUD, hierarchy, prerequisites, conversions), SourceCard,
  SourceDetail with tabs, reading status components, stores, and types
- practices/: API hooks (CRUD, search, topic/source linking), PracticeCard,
  PracticeDetail, relationship panels, stores, and types
All functionality consolidated into notes feature with tag-based capabilities.
EOF
)"
```

### 49) `refactor(web): delete TopicDialog providers and entity conversion utilities`
```bash
git add -A apps/web/src/features/dialogs
git add -A apps/web/src/hooks/useConversionNavigate.ts
git add -A apps/web/src/hooks/useEntityNavigation.ts
git add -A apps/web/src/models/entity-relations.schema.ts
git add -A apps/web/src/models/entity-relations.types.ts
git add -A apps/web/src/components/ConversionConfirmationDialog.tsx
git add -A apps/web/src/utils/ConversionError.ts
git add -A apps/web/src/utils/conversionPreview.ts
git commit -m "$(cat <<'EOF'
refactor(web): delete TopicDialog providers and entity conversion utilities

Removes TopicDialogProvider, TopicDialogContext, and useTopicDialog hook
for the global topic creation modal. Removes useConversionNavigate and
useEntityNavigation hooks for legacy entity-type routing. Removes
entity-relations Valibot schemas and types for cross-entity relationships.
Removes ConversionConfirmationDialog with migration preview, blocker
display, and confirmation flow. Removes ConversionError and conversionPreview
utilities. Entity type conversions no longer needed with unified notes model.
EOF
)"
```

### 50) `refactor(web): delete EntityCard and LearnableCard component families`
```bash
git add -A apps/web/src/components/EntityCard.tsx
git add -A apps/web/src/components/EntityCardSection.tsx
git add -A apps/web/src/components/LearnableCard
git add -A apps/web/src/components/LearnableDetailHeader.tsx
git commit -m "$(cat <<'EOF'
refactor(web): delete EntityCard and LearnableCard component families

Removes EntityCard polymorphic wrapper that delegated to TopicCard,
SourceCard, or PracticeCard based on entity type discriminant. Removes
EntityCardSection grid layout wrapper. Removes LearnableCard/ directory
with LearnableCardBase providing shared card chrome, header badges, status
badges, and reveal toggle for all entity cards. Removes LearnableDetailHeader
with inline editing, SRS controls, and action toolbar. NoteCard now provides
unified card rendering with tag-based styling.
EOF
)"
```

### 51) `refactor(web): delete ReviewsSidebar, EntitySearchDialog, and reviewSections utilities`
```bash
git add -A apps/web/src/components/ReviewsSidebar
git add -A apps/web/src/components/search/EntitySearchDialog.tsx
git add -A apps/web/src/app/types/reviewSections.types.ts
git add -A apps/web/src/app/utils/reviewSections.ts
git commit -m "$(cat <<'EOF'
refactor(web): delete ReviewsSidebar, EntitySearchDialog, and reviewSections utilities

Removes ReviewsSidebar/ component for displaying review lists in detail
page sidebars. Removes EntitySearchDialog multi-entity search modal with
type tabs, result rendering via TopicCard/SourceCard/PracticeCard, and
action menus for search results. Removes reviewSections.types.ts defining
ReviewSection, TopicSection, and MergedSection types. Removes reviewSections.ts
with mergeReviewSections() utility for combining review and topic section
data. Functionality replaced by note-based search and review displays.
EOF
)"
```

### 52) `test(web): delete legacy topic mocks and searchTopics stub`
```bash
git add -A apps/web/src/App.test.tsx
git add -A apps/web/src/__mocks__/handlers.ts
git add -A apps/web/src/__mocks__/data/topics.json
git commit -m "$(cat <<'EOF'
test(web): delete legacy topic mocks and searchTopics stub

Removes searchTopics vi.mock() from App.test.tsx. Removes topic-related
MSW handlers from handlers.ts: GET /topics/:topicId/ with nested topic
lookup, and GET /topics/:topicId/related/ returning mock related topics
with full Topic shape. Removes topics.json mock fixture data. Test mocks
now only cover notes-based API endpoints.
EOF
)"
```

## Validation Checkpoints
Run these checkpoints after major transitions:

1. After commit 11 (notes + review queue tests in place):
```bash
cd apps/api && uv run pytest tests/notes tests/review_queue
```

2. After commit 12 (note-native API contracts and tests in place):
```bash
cd apps/api && uv run pytest tests/notes tests/review_queue tests/reviews tests/search
```

3. After commit 13 (schema + seed alignment moved earlier):
```bash
cd supabase && supabase db reset
cd ../apps/api && uv run pytest tests/notes tests/review_queue tests/reviews tests/search
```

4. After commit 17 (note route typing in generated route tree):
```bash
cd apps/web && pnpm run lint
```

5. After commit 22 (note routes + detail surface complete):
```bash
cd apps/web && pnpm run lint
```

6. After commit 25 (app shell wiring migrated to notes):
```bash
cd apps/web && pnpm run lint
```

7. After commit 26 (legacy route files and generated route-tree entries removed):
```bash
cd apps/web && pnpm run lint
```

8. After commit 32 (core pages migrated to notes):
```bash
cd apps/web && pnpm run lint
```

9. After commit 40 (legacy routers/tests removed, fixture contracts migrated, and package exports aligned before model/schema deletions):
```bash
cd apps/api && uv run pytest
```

10. After commit 44 (legacy API route/model/schema/test removals complete):
```bash
cd apps/api && uv run pytest
```

11. After commit 48 (legacy feature-tree removals complete):
```bash
cd apps/web && pnpm run lint
```

12. After commit 51 (shared UI helper removals complete):
```bash
cd apps/web && pnpm run lint
```

13. After commit 52 (final verification):
```bash
cd apps/api && uv run pytest
cd ../web && pnpm run validate
```

## Notes
1. Commits 1-13 establish schema and note-native API contracts in additive mode.
2. Commits 14-32 migrate routing and core web surfaces to notes before destructive API removals.
3. Commits 33-44 remove legacy API routers/tests first, then fixture/export contracts, then legacy models/schemas once old imports are gone.
4. Commit 5 stages only additive note-router wiring in `main.py`; commits 33/35/37 remove legacy routers in domain order, with matching test-suite deletions in commits 34/36/38.
5. Commit 40 finalizes `app.models`/`app.schemas` package-export cleanup before destructive model/schema deletions to prevent import-time breakage.
6. Commit 17 stages only additive `routeTree.gen.ts` hunks for `/notes/$noteId`; commit 26 stages the full legacy-removal snapshot.
7. Commit 26 lands route-tree cleanup next to route-file deletions to reduce long-lived partial staging risk.
8. Commits 16, 20, 21, and 22 split `NoteDetailPage` into reviewable chunks.
9. Commit 16 uses `git add -N` before `git add -p` so `NoteDetailPage.tsx` can be split across commits 16/20/21/22.
10. Commit 24 includes `groupByDate.ts` with search type/schema migration so shared search helpers stay type-consistent in each commit.
11. Commit 48 removes interdependent legacy web feature trees (`topics`/`sources`/`practices`) atomically; commits 49-51 then remove shared UI/helpers that were only referenced by those trees.
12. If any commit still feels large, split further by file (especially service files and page files).
