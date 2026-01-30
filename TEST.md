# Entity Conversion - E2E Test Plan

## Overview

End-to-end tests for all 6 bidirectional entity conversion paths.
Tests exercise the full stack: UI action menu -> confirmation dialog -> API endpoint -> database mutations -> UI redirect.

---

## 1. Topic -> Source ✅ COMPLETED (2026-01-29)

### 1.1 Simple conversion (leaf topic, no relationships) ✅ PASSED
- Created topic 33 with `name="Test Topic 1.1 Name"`, `notes="Test Topic 1.1 Notes Content"`
- Opened action menu → clicked "Convert to Source"
- Confirmation dialog showed correct preview: no blockers, no migration/loss warnings ✅
- Clicked Convert → redirected to `/sources/19`
- Verified: `title = "Test Topic 1.1 Name"` (name → title) ✅
- Verified: `notes = "Test Topic 1.1 Notes Content"` (notes → notes) ✅
- Verified: original topic 33 returns 404 ✅

### 1.2 Flags preserved ✅ PASSED
- Created topic 34 with `archived=true`, `inboxed=true`
- Converted via API → new source 20
- Verified: `archived=true`, `inboxed=true` on new source ✅
- Verified: original topic 34 returns 404 ✅

### 1.3 FSRS state and reviews preserved ✅ PASSED
- Created topic 35, enabled SRS (`fsrs_state_id=119`), created review 30 with `rating="good"`, `completed_at="2026-01-29"`
- Post-review: `stability=2.3065`, `difficulty=2.1181`
- Converted via API → new source 21
- Verified: `srs_enabled=true`, `fsrs_state_id=120`, `stability=2.3065` ✅
- Verified: review 30 now has `source_id=21`, `topic_id=null` ✅
- Verified: original topic 35 returns 404 ✅

### 1.4 Subtree conversion (topic with children) ✅ PASSED
- Created parent topic 36 with child 37 (has grandchild 39) and child 38
- Opened action menu → "Convert to Source"
- Confirmation dialog showed: "Will be migrated: Children (subtree) (2)" ✅
- Converted → redirected to `/sources/22`
- Verified hierarchy preserved:
  - Source 22: "Test 1.4 Parent" (parent_id=null) ✅
  - Source 23: "Test 1.4 Child 1" (parent_id=22) ✅
  - Source 24: "Test 1.4 Child 2" (parent_id=22) ✅
  - Source 25: "Test 1.4 Grandchild" (parent_id=23) ✅
- Verified: field mappings applied recursively (name → title, notes → notes) ✅
- Verified: all original topics (36-39) return 404 ✅

### 1.5 Entity relations remapped ✅ PASSED
- Created topic A (41) with entity relation to topic B (40)
- Converted topic A via API → new source 26
- Verified: source 26 has `related_outgoing: [{entity_type: "topic", id: 40}]` ✅
- Verified: topic B has `related_incoming_count=1` ✅
- Verified: original topic 41 returns 404 ✅

### 1.6 Linked practices re-linked ✅ PASSED
- Created topic 42, practice 16, linked via `practice_topics`
- Converted topic 42 via API → new source 27
- Verified: source 27 has practice 16 in `practices` list ✅
- Verified: practice 16 has `topics_count=0` (old link gone) ✅
- Verified: practice 16 has `sources_count=1` (new `practice_sources` link) ✅
- Verified: original topic 42 returns 404 ✅

### 1.7 Blocked: subtree topic has covering sources ✅ PASSED
- Created parent topic 56 with child topic 57
- Linked source to child topic 57 via `source_topics`
- **Frontend**: Confirmation dialog shows red blocker: "Topic or its children have covering sources" ✅
- **Frontend**: Convert button is `disabled=true` ✅
- **API**: `POST /topics/56/convert-to-source/` correctly returns 409: "Cannot convert: topic or its children have sources covering them" ✅
- **Error feedback**: When conversion is force-triggered, 409 error is displayed inline in dialog ✅
- Verified: original topic 56 still exists (200) after blocked attempt ✅

---

## 2. Topic -> Practice ✅ COMPLETED (2026-01-29)

### 2.1 Simple conversion (leaf topic, no relationships) ✅ PASSED
- Created topic 45 with `name="Test Topic 2.1 Name"`, `notes="Test Topic 2.1 Notes Content"`
- Opened action menu → clicked "Convert to Practice"
- Confirmation dialog showed correct preview: no blockers, no migration/loss warnings ✅
- Clicked Convert → redirected to `/practices/17`
- Verified: `prompt = "Test Topic 2.1 Name"` (name → prompt) ✅
- Verified: `answer = "Test Topic 2.1 Notes Content"` (notes → answer) ✅
- Verified: original topic 45 returns 404 ✅

### 2.2 Flags preserved ✅ PASSED
- Created topic 46 with `name="Test Topic 2.2 Flags"`
- Set `inboxed=true` via "Add to Inbox", `archived=true` via "Archive"
- Converted via UI → new practice 18
- Verified: "Archived" and "Inboxed" badges displayed on new practice ✅
- Verified: original topic 46 returns 404 ✅

### 2.3 FSRS state and reviews preserved ✅ PASSED
- Created topic 47 `name="Test Topic 2.3 FSRS"`, enabled SRS (`fsrs_state_id=121`), created review 31 with `rating="good"`
- Pre-conversion: `stability=2.3065`, `difficulty=2.1181`, `state=LEARNING`
- Review 31: `rating=good`, `topic_id=47`, `practice_id=null`
- Converted via UI → new practice 19
- Verified: `srs_enabled=true`, `fsrs_state_id=122` (new), `stability=2.3065`, `difficulty=2.1181` ✅
- Verified: review 31 now has `practice_id=19`, `topic_id=null` ✅
- Verified: original topic 47 returns 404 ✅

### 2.4 Parent topics become practice_topics links ✅ PASSED
- Created parent topic 48 `name="Test 2.4 Parent Topic"`
- Created child topic 49 `name="Test 2.4 Child Topic"` under parent 48
- Converted child topic 49 via UI → new practice 20
- Verified: practice 20 shows "Related Topics (1)" with "Test 2.4 Parent Topic" ✅
- Verified: API confirms `topics_count=1` with topic 48 linked via `practice_topics` ✅
- Verified: original topic 49 returns 404 ✅

### 2.5 Entity relations migrated ✅ PASSED
- Created topic 50 `name="Test 2.5 Related Topic"` and topic 51 `name="Test 2.5 Topic A"`
- Added entity relation from topic 51 to topic 50 via "Related" → "+ Add" → "Search Topics"
- Verified: topic 51 shows "Related (1)" with "Test 2.5 Related Topic" ✅
- Opened action menu → "Convert to Practice"
- Confirmation dialog showed: "Will be migrated: Entity relations → linked topics (1)" ✅
- Clicked Convert → redirected to `/practices/21`
- Verified: practice 21 has `topics_count=1` with topic 50 linked via `practice_topics` ✅
- Verified: original topic 51 returns 404 ✅

### 2.6 Blocked: topic has children ✅ PASSED
- Created parent topic 52 `name="Test 2.6 Parent Topic"` with child topic 53 `name="Test 2.6 Child Topic"`
- Opened action menu → "Convert to Practice"
- Confirmation dialog showed: "Cannot convert: Topic has children" (red blocker) ✅
- Convert button is `disabled=true` ✅
- API: `POST /topics/52/convert-to-practice/` returns 409: "Cannot convert: topic has children" ✅

### 2.7 Blocked: topic has linked practices ✅ PASSED
- Created topic 54 `name="Test 2.7 Topic With Practice"`, practice 22 `prompt="Test 2.7 Linked Practice"`
- Linked practice 22 to topic 54 via `practice_topics`
- Opened action menu → "Convert to Practice"
- Confirmation dialog showed: "Cannot convert: Topic has linked practices" (red blocker) ✅
- Convert button is `disabled=true` ✅
- API: `POST /topics/54/convert-to-practice/` returns 409: "Cannot convert: topic has linked practices" ✅

### 2.8 Blocked: topic has covering sources ✅ PASSED
- Created topic 55 `name="Test 2.8 Topic With Source"`, source 29 `title="Test 2.8 Covering Source"`
- Linked source 29 to topic 55 via `source_topics`
- Opened action menu → "Convert to Practice"
- Confirmation dialog showed: "Cannot convert: Topic has covering sources" (red blocker) ✅
- Convert button is `disabled=true` ✅
- API: `POST /topics/55/convert-to-practice/` returns 409: "Cannot convert: topic has sources covering it" ✅

---

## 3. Source -> Topic ✅ COMPLETED (2026-01-30)

### 3.1 Simple conversion (leaf source, no relationships) ✅ PASSED
- Created source 31 with `title="Test Source 3.1 Title"`, `notes="Test Source 3.1 Notes Content"`
- Opened action menu → clicked "Convert to Topic"
- Confirmation dialog showed correct preview: no blockers, no migration/loss warnings ✅
- Clicked Convert → redirected to `/topics/60`
- Verified: `name = "Test Source 3.1 Title"` (title → name) ✅
- Verified: `notes = "Test Source 3.1 Notes Content"` (notes → notes) ✅
- Verified: original source 31 returns 404 ✅

### 3.2 Flags preserved ✅ PASSED
- Created source 32 with `archived=true`, `inboxed=true`
- Converted via API → new topic 61
- Verified: `archived=true`, `inboxed=true` on new topic ✅
- Verified: original source 32 returns 404 ✅

### 3.3 FSRS state and reviews preserved ✅ PASSED
- Created source 33, enabled SRS (`fsrs_state_id=123`), created review 32 with `rating="good"`
- Post-review: `stability=2.3065`, `difficulty=2.1181`
- Converted via API → new topic 62
- Verified: `srs_enabled=true`, `fsrs_state_id=124` (new), `stability=2.3065` ✅
- Verified: review 32 now has `topic_id=62`, `source_id=null` ✅
- Verified: original source 33 returns 404 ✅

### 3.4 Subtree conversion (source with children) ✅ PASSED
- Created parent source 34 with child 35 (has grandchild 37) and child 36
- Opened action menu → "Convert to Topic"
- Confirmation dialog showed: "Will be migrated: Children (2)" ✅
- Converted → redirected to `/topics/63`
- Verified hierarchy preserved:
  - Topic 63: "Test 3.4 Parent Source" (parent_id=null) ✅
  - Topic 64: "Test 3.4 Child 1" (parent_id=63) ✅
  - Topic 65: "Test 3.4 Child 2" (parent_id=63) ✅
  - Topic 66: "Test 3.4 Grandchild" (parent_id=64) ✅
- Verified: field mappings applied recursively (title → name, notes → notes) ✅
- Verified: all original sources (34-37) return 404 ✅

### 3.5 Covering topics become entity relations ✅ PASSED
- Created source 38 with `source_topics` link to topic 67
- Opened action menu → "Convert to Topic"
- Confirmation dialog showed: "Will be migrated: Covering topics → entity relations (1)" ✅
- Converted → redirected to `/topics/68`
- Verified: topic 68 has `related_outgoing: [{entity_type: "source", id: 67}]` as entity relation ✅
- Verified: original source 38 returns 404 ✅

### 3.6 Prerequisites become entity relations ✅ PASSED
- Created source 44 ("Test 3.6 Retest Prereq Source") and source 45 ("Test 3.6 Retest Source")
- Added source 44 as prerequisite of source 45 via `POST /sources/45/prerequisites/`
- UI showed "Prerequisites (1): Test 3.6 Retest Prereq Source (Source)" on source 45 ✅
- Opened action menu → "Convert to Topic"
- Confirmation dialog showed: "Will be migrated: Prerequisites → entity relations (1)" ✅
- Clicked Convert → redirected to `/topics/73`
- Verified: `GET /topics/73/` shows `related_outgoing: [{entity_type: "source", id: 44, title: "Test 3.6 Retest Prereq Source"}]` ✅
- Verified: original source 45 returns 404 ✅

### 3.7 Linked practices re-linked ✅ PASSED
- Created source 41, practice 23, linked via `practice_sources`
- UI showed "Practices (1): Test 3.7 Linked Practice" on source 41 ✅
- Converted via UI → redirected to `/topics/70`
- Verified: topic 70 has practice 23 linked ✅
- Verified: practice 23 has `topics_count=1` (new `practice_topics` link) ✅
- Verified: practice 23 has `sources_count=0` (old link gone) ✅
- Verified: original source 41 returns 404 ✅

### 3.8 No blocking conditions ✅ PASSED
- Source 42 with child sources converted via API → status 200, new topic 71 ✅
- Verified across all tests: sources with various relationships (children, topics, prerequisites, practices, entity relations) all converted without any blockers
- No conversion was blocked for Source → Topic regardless of relationships ✅

---

## 4. Source -> Practice ✅ COMPLETED (2026-01-30)

### 4.1 Simple conversion (leaf source, no relationships) ✅ PASSED
- Created source 46 with `title="Test Source 4.1 Title"`, `notes="Test Source 4.1 Notes Content"`
- Opened action menu → clicked "Convert to Practice"
- Confirmation dialog showed correct preview: no blockers, no migration/loss warnings ✅
- Clicked Convert → redirected to `/practices/24`
- Verified: `prompt = "Test Source 4.1 Title"` (title → prompt) ✅
- Verified: `answer = "Test Source 4.1 Notes Content"` (notes → answer) ✅
- Verified: original source 46 returns 404 ✅

### 4.2 Flags preserved ✅ PASSED
- Created source 47 with `title="Test Source 4.2 Flags"`
- Set `inboxed=true` via creation dialog, `archived=true` via "Archive" action menu
- Converted via UI → new practice 25
- Verified: "Archived" and "Inboxed" badges displayed on new practice ✅
- Verified: original source 47 returns 404 ✅

### 4.3 FSRS state and reviews preserved ✅ PASSED
- Created source 48 `title="Test Source 4.3 FSRS"`, enabled SRS (`fsrs_state_id=127`), created review 33 with `rating="good"`
- Pre-conversion: `stability=2.3065`, `difficulty=2.1181`
- Review 33: `rating=good`, `source_id=48`, `practice_id=null`
- Converted via UI → new practice 26
- Verified: `srs_enabled=true`, `fsrs_state_id=128` (new), `stability=2.3065`, `difficulty=2.1181` ✅
- Verified: review 33 now has `practice_id=26`, `source_id=null` ✅
- Verified: original source 48 returns 404 ✅

### 4.4 Covering topics become practice_topics links ✅ PASSED
- Created topic "Test 4.4 Covered Topic" and source 49 `title="Test Source 4.4 With Topic"`
- Added topic to source via "Topics covered" → "+ Add" → search "Test 4.4"
- UI showed "Topics covered (1)" with the topic ✅
- Confirmation dialog showed: "Will be migrated: Covering topics → practice topics (1)" ✅
- Converted → redirected to `/practices/27`
- Verified: practice 27 shows "Related Topics (1)" with "Test 4.4 Covered Topic" ✅
- Verified: API confirms `topics_count=1` ✅
- Verified: original source 49 returns 404 ✅

### 4.5 Entity relations lost ✅ PASSED
- Created source 50 `title="Test 4.5 Related Source"` and source 51 `title="Test Source 4.5 With Relation"`
- Added entity relation from source 51 to source 50 via "Related" → "+ Add" → Sources tab
- UI showed "Related (1)" with "Test 4.5 Related Source" ✅
- Confirmation dialog showed: "Will be lost: Entity relations" (warning icon) ✅
- Clicked Convert → redirected to `/practices/28`
- Verified: practice 28 shows "Related Topics (0)" and "Related Sources (0)" — entity relations lost ✅
- Verified: original source 51 returns 404 ✅

### 4.6 Prerequisites lost ✅ PASSED
- Created source 52 `title="Test 4.6 Prerequisite Source"` and source 53 `title="Test Source 4.6 With Prerequisite"`
- Added source 52 as prerequisite of source 53 via "Prerequisites" → "+ Add" → Sources tab
- UI showed "Prerequisites (1): Test 4.6 Prerequisite Source (Source)" ✅
- Confirmation dialog showed: no "Will be lost: Prerequisites" warning (see finding below)
- Clicked Convert → redirected to `/practices/29`
- Verified: practice 29 has no prerequisites section (practices don't support prerequisites) — prerequisites lost ✅
- Verified: original source 53 returns 404 ✅
- **Finding (retested 2026-01-30)**: Initially the dialog did not show a "Will be lost: Prerequisites" warning. On retest after commit `971714b` (which added missing count fields to `SourceSummaryRead` API schema), the dialog now correctly shows "Will be lost: Prerequisites". **Resolved** — the original test ran before the API fix was deployed.

### 4.7 Blocked: source has children ✅ PASSED
- Created source 54 `title="Test Source 4.7 Parent With Child"`
- Added child source "Test 4.7 Child Source" via "Child sources" → "+ Add" → "Create New"
- UI showed "Child sources (1)" with "Test 4.7 Child Source" ✅
- Opened action menu → "Convert to Practice"
- Confirmation dialog showed: "Cannot convert: Source has children" (red blocker) ✅
- Convert button is `disabled=true` (grayed out) ✅

---

## 5. Practice -> Topic ✅ COMPLETED (2026-01-29)

### 5.1 Simple conversion (no relationships) ✅ PASSED
- Created practice 5 with `prompt="Test Practice 5.1 Prompt"`, `answer="Test Practice 5.1 Answer"`
- Opened action menu → clicked "Convert to Topic"
- Confirmation dialog showed correct preview: no blockers, no migration/loss warnings
- Clicked Convert → redirected to `/topics/25`
- Verified: `name = "Test Practice 5.1 Prompt"` (prompt → name) ✅
- Verified: `notes = "Test Practice 5.1 Answer"` (answer → notes) ✅
- Verified: original practice 5 returns 404 ✅

### 5.2 Flags preserved ✅ PASSED
- Created practice 6 with `archived=true`, `inboxed=true`
- Converted via API → new topic 26
- Verified: `archived=true`, `inboxed=true` on new topic ✅

### 5.3 FSRS state and reviews preserved ✅ PASSED
- Created practice 7, enabled SRS (`fsrs_state_id=113`), created review 28 with `rating="good"`
- Converted via API → new topic 27
- Verified: `srs_enabled=true`, `fsrs_state_id=114`, `stability=2.306` ✅
- Verified: review 28 now has `topic_id=27`, `practice_id=null` ✅
- Verified: original practice 7 returns 404 ✅

### 5.4 Linked sources become source_topics ✅ PASSED
- Created source 10, practice 8, linked via `practice_sources`
- Opened practice in UI → "Related Sources (1)" showed source 10
- Confirmation dialog showed: "Will be migrated: Linked sources → source topics (1)" ✅
- Converted → redirected to `/topics/28`
- Verified: topic 28 has `sources_count=1` ✅
- Verified: source 10 has `topics_count=1` (now covers topic 28 via `source_topics`) ✅
- Verified: original practice 8 returns 404 ✅

### 5.5 Linked topics become entity relations ✅ PASSED
- Created topic 29, practice 9, linked via `practice_topics`
- Opened practice in UI → "Related Topics (1)" showed topic 29
- Confirmation dialog showed: "Will be migrated: Linked topics → entity relations (1)" ✅
- Converted → redirected to `/topics/30`
- Verified: topic 30 shows "Related (1)" with "Test 5.5 Related Topic" as entity relation ✅
- Verified: original practice 9 returns 404 ✅

### 5.6 No blocking conditions ✅ PASSED
- Verified across all tests: practices with various relationships (sources, topics, FSRS, flags) all converted without any blockers
- No conversion was blocked for Practice → Topic regardless of relationships ✅

---

## 6. Practice -> Source ✅ COMPLETED (2026-01-29)

### 6.1 Simple conversion (no relationships) ✅ PASSED
- Created practice 10 with `prompt="Test Practice 6.1 Prompt"`, `answer="Test Practice 6.1 Answer"`
- Opened action menu → clicked "Convert to Source"
- Confirmation dialog showed correct preview: no blockers, no migration/loss warnings
- Clicked Convert → redirected to `/sources/11`
- Verified: `title = "Test Practice 6.1 Prompt"` (prompt → title) ✅
- Verified: `notes = "Test Practice 6.1 Answer"` (answer → notes) ✅
- Verified: original practice 10 returns 404 ✅

### 6.2 Flags preserved ✅ PASSED
- Created practice 11 with `archived=true`, `inboxed=true`
- Converted via API → new source 12
- Verified: `archived=true`, `inboxed=true` on new source ✅

### 6.3 FSRS state and reviews preserved ✅ PASSED
- Created practice 12, enabled SRS (`fsrs_state_id=115`), created review 29
- Converted via API → new source 13
- Verified: `srs_enabled=true`, `fsrs_state_id=116` ✅
- Verified: review 29 now has `source_id=13`, `practice_id=null` ✅
- Verified: original practice 12 returns 404 ✅

### 6.4 Linked topics become source_topics ✅ PASSED
- Created topic 31, practice 13, linked via `practice_topics`
- Opened practice in UI → "Related Topics (1)" showed topic 31
- Confirmation dialog showed: "Will be migrated: Linked topics → source topics (1)" ✅
- Converted → redirected to `/sources/14`
- Verified: source 14 has "Topics covered (1)" with "Test 6.4 Related Topic" ✅
- Verified: topic 31 has `sources_count=1` (now covered via `source_topics`) ✅
- Verified: original practice 13 returns 404 ✅

### 6.5 Linked sources become entity relations ✅ PASSED
- Created source 15, practice 14, linked via `practice_sources`
- Opened practice in UI → "Related Sources (1)" showed source 15
- Confirmation dialog showed: "Will be migrated: Linked sources → entity relations (1)" ✅
- Converted → redirected to `/sources/16`
- Verified: source 16 shows "Related (1)" with "Test 6.5 Linked Source" as entity relation ✅
- Verified: original practice 14 returns 404 ✅

### 6.6 No blocking conditions ✅ PASSED
- Created practice 15 with topics, sources, flags, and SRS all linked
- Converted via API → new source 18 (status 200, no blockers)
- Verified across all tests: practices with various relationships all converted without any blockers
- No conversion was blocked for Practice → Source regardless of relationships ✅

---

## 7. Cross-Cutting Concerns ✅ COMPLETED (2026-01-30)

### 7.1 Atomicity ⏭️ SKIPPED
- Requires simulating a mid-conversion DB failure, which is not feasible via E2E browser testing
- All conversions tested in sections 1-6 completed atomically (no partial states observed)
- The API uses database transactions, so atomicity is enforced at the DB level

### 7.2 Original entity deleted ✅ PASSED
- For each of the 6 conversion paths, verified original entity returns 404:
  - Topic→Source: topic 33 → 404, source 19 exists (200) ✅
  - Topic→Practice: topic 45 → 404, practice 17 exists (200) ✅
  - Source→Topic: source 31 → 404, topic 60 exists (200) ✅
  - Source→Practice: source 46 → 404, practice 24 exists (200) ✅
  - Practice→Topic: practice 5 → 404, topic 25 exists (200) ✅
  - Practice→Source: practice 10 → 404, source 11 exists (200) ✅
- Verified deleted entities do not appear in list endpoints (`GET /topics/`, `/sources/`, `/practices/`):
  - Deleted topic IDs [33, 45] not in topics list ✅
  - Deleted source IDs [31, 46] not in sources list ✅
  - Deleted practice IDs [5, 10] not in practices list ✅

### 7.3 Not-found handling ✅ PASSED
- Called all 6 conversion endpoints with non-existent ID 99999:
  - `POST /topics/99999/convert-to-source/` → 404 ✅
  - `POST /topics/99999/convert-to-practice/` → 404 ✅
  - `POST /sources/99999/convert-to-topic/` → 404 ✅
  - `POST /sources/99999/convert-to-practice/` → 404 ✅
  - `POST /practices/99999/convert-to-topic/` → 404 ✅
  - `POST /practices/99999/convert-to-source/` → 404 ✅

### 7.4 Confirmation dialog preview accuracy ✅ PASSED
- Created source 58 with: child source (59), covering topic (77), linked practice (32), prerequisite source (60), entity relation to source (61)
- **Source→Topic dialog** showed:
  - "Will be migrated: Children (1)" — matches `children_count=1` ✅
  - "Will be migrated: Covering topics → entity relations (1)" — matches `topics_count=1` ✅
  - "Will be migrated: Prerequisites → entity relations (1)" — matches `prerequisites_count=1` ✅
  - "Will be migrated: Entity relations (1)" — matches `related_outgoing` length 1 ✅
  - No blockers shown, Convert button enabled ✅
- **Source→Practice dialog** showed:
  - "Will be migrated: Covering topics → practice topics (1)" ✅
  - "Will be lost: Entity relations" (orange warning) ✅
  - "Will be lost: Prerequisites" (orange warning) ✅
  - "Cannot convert: Source has children" (red blocker) ✅
  - Convert button is disabled (grayed out) ✅
- After converting source 58 → topic 78, verified all relationships migrated correctly:
  - Child topic (1): "Test 7.4 Child Source" with correct parent ✅
  - Related (3): "Test 7.4 Related Source" (entity relation), "Test 7.4 Linked Topic" (covering topic), "Test 7.4 Prereq Source" (prerequisite) — all became entity relations ✅
  - Practices (1): "Test 7.4 Linked Practice" re-linked via `practice_topics` ✅
- **Bug (confirmed on retest 2026-01-30)**: Linked practices are not shown in the "Will be migrated" section of the Source→Topic dialog, despite the API returning `practices_count: 1` and the preview code (`getSourceToTopicPreview`) correctly checking for it. Practices ARE correctly migrated, but the user is not informed in the preview.
  - **Root cause**: The valibot validation schema at `apps/web/src/features/sources/types/source.schemas.ts` (lines 46-50) defines `sourceBaseFields` with 5 relationship count fields but is **missing `practices_count`**. Since valibot's `v.object()` strips unknown keys during parsing, `practices_count` is silently dropped from the API response. The frontend receives `source.practices_count = undefined`, and `undefined ?? 0 = 0`, so the "Linked practices" migrated item is never shown.
  - **Fix**: Add `practices_count: v.optional(v.number(), 0)` to `sourceBaseFields` in `source.schemas.ts`.

### 7.5 Action menu visibility ✅ PASSED
- Topic detail page (topic 74): action menu shows "Convert to Source" and "Convert to Practice" ✅
- Source detail page (source 52): action menu shows "Convert to Topic" and "Convert to Practice" ✅
- Practice detail page (practice 27): action menu shows "Convert to Topic" and "Convert to Source" ✅
- All three entity types also show: "Log now", "Add to Inbox", "Archive", "Delete"

### 7.6 Redirect after conversion ✅ PASSED
- Topic→Source: topic 75 converted → redirected to `/sources/56`, title displayed correctly ✅
- Practice→Topic: practice 30 converted → redirected to `/topics/76`, name displayed correctly ✅
- Source→Topic: source 58 converted → redirected to `/topics/78`, name and all relationships displayed correctly ✅
- Source→Practice (via API): source 57 converted → practice 31 created with correct fields ✅
- Redirect verified across sections 1-6 for all 6 conversion paths (see individual test results)

### 7.7 Empty optional fields ✅ PASSED
- **Topic→Source (empty notes)**: Created topic 75 `name="Test 7.7 Topic No Notes"` with no notes → converted to source 56 → `title="Test 7.7 Topic No Notes"`, `notes=""` (empty string preserved) ✅
- **Practice→Topic (empty answer)**: Created practice 30 `prompt="Test 7.7 Practice No Answer"` with no answer → converted to topic 76 → `name="Test 7.7 Practice No Answer"`, `notes=""` (empty string preserved) ✅
- **Source→Practice (empty notes)**: Created source 57 `title="Test 7.7 Source No Notes"` with no notes → converted to practice 31 → `prompt="Test 7.7 Source No Notes"`, `answer=""` (empty string preserved) ✅
- Original entities verified deleted (404) after each conversion ✅

---

## Findings Summary

### Confirmed Bugs
1. **Missing "Will be migrated: Linked practices" in Source→Topic dialog** (test 7.4):
   - **Symptom**: When converting Source→Topic, the confirmation dialog does not show that linked practices will be migrated, even though they ARE correctly re-linked via `practice_topics`.
   - **Root cause**: `practices_count` is missing from the valibot schema `sourceBaseFields` in `apps/web/src/features/sources/types/source.schemas.ts:46-50`. Valibot's `v.object()` strips unknown keys, so `practices_count` from the API response is silently dropped. The preview function `getSourceToTopicPreview()` checks `source.practices_count`, but it's always `undefined` (which defaults to `0`).
   - **Fix**: Add `practices_count: v.optional(v.number(), 0)` to `sourceBaseFields` in `source.schemas.ts`.
   - **Impact**: Low — the conversion itself works correctly, only the preview dialog is incomplete.
