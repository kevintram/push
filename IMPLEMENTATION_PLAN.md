# Robust Entity Conversion — Implementation Plan

## Summary

Expand entity conversion from 2 paths (Topic→Source, Topic→Practice) to all 6 bidirectional paths, add a children-blocking condition to Topic→Practice, and introduce a confirmation dialog with preview before every conversion.

---

## Phase 1: Backend — Fix + New Conversion Logic

### 1A. Fix Topic→Practice children block

**File:** `apps/api/app/topics/service.py`

Add children count check at the top of `check_topic_convertible_to_practice` (before existing practice/source checks):
```python
children_count = await session.execute(
    select(func.count()).select_from(Topic).where(
        Topic.parent_id == topic_id, Topic.user_id == user_id
    )
)
if children_count.scalar() > 0:
    return False, "topic has children"
```

### 1B. Source → Topic conversion

**File:** `apps/api/app/sources/service.py`

Add `convert_source_to_topic()` — mirrors existing `convert_topic_to_source()` in topics/service.py:

- **Scope:** Entire subtree (ltree `<@` query)
- **Mapping:** `title`→`name`, `notes`→`notes`, flags, FSRS (all 11 fields incl. inherited)
- **Migrates:** hierarchy, practices (`practice_sources`→`practice_topics`), reviews (`source_id`→`topic_id`), entity relations (remap `from_source`→`from_topic`, `to_source`→`to_topic`)
- **Special:** `source_topics` entries → `entity_relations` (new topic related to covered topics); `source_prerequisites` → `entity_relations`
- **Blocking:** None
- Delete originals children-first, single commit

### 1C. Source → Practice conversion

**File:** `apps/api/app/sources/service.py`

Add `check_source_convertible_to_practice()` and `convert_source_to_practice()`:

- **Scope:** Single source
- **Mapping:** `title`→`prompt`, `notes`→`answer`, flags, FSRS (core 6 fields)
- **Migrates:** reviews (`source_id`→`practice_id`), `source_topics` → `practice_topics`
- **Lost:** entity relations, prerequisites, `practice_sources` entries (cascade)
- **Blocked if:** has children

### 1D. Practice → Topic conversion

**File:** `apps/api/app/practices/service.py`

Add `convert_practice_to_topic()`:

- **Scope:** Single item
- **Mapping:** `prompt`→`name`, `answer`→`notes`, flags, FSRS (core 6 fields)
- **Migrates:** reviews (`practice_id`→`topic_id`), `practice_sources` → `source_topics` (sources now cover new topic), `practice_topics` → `entity_relations` (new topic related to each)
- **Blocking:** None

### 1E. Practice → Source conversion

**File:** `apps/api/app/practices/service.py`

Add `convert_practice_to_source()`:

- **Scope:** Single item
- **Mapping:** `prompt`→`title`, `answer`→`notes`, flags, FSRS (core 6 fields)
- **Migrates:** reviews (`practice_id`→`source_id`), `practice_topics` → `source_topics` (new source covers those topics), `practice_sources` → `entity_relations` (new source related to each linked source)
- **Blocking:** None

### 1F. Router endpoints

**File:** `apps/api/app/sources/router.py`
- `POST /{source_id}/convert-to-topic/` → `ConvertSourceToTopicResponse`
- `POST /{source_id}/convert-to-practice/` → `ConvertSourceToPracticeResponse`

**File:** `apps/api/app/practices/router.py`
- `POST /{practice_id}/convert-to-topic/` → `ConvertPracticeToTopicResponse`
- `POST /{practice_id}/convert-to-source/` → `ConvertPracticeToSourceResponse`

### 1G. Response schemas

**File:** `apps/api/app/schemas/sources.py` — add `ConvertSourceToTopicResponse`, `ConvertSourceToPracticeResponse`

**File:** `apps/api/app/schemas/practices.py` — add `ConvertPracticeToTopicResponse`, `ConvertPracticeToSourceResponse`

**File:** `apps/api/app/schemas/__init__.py` — export new schemas

### Verify Phase 1
```bash
cd apps/api && uv run ruff check --fix && uv run ruff format
cd apps/api && uv run pytest tests/topics/test_conversion.py -v
```

---

## Phase 2: Backend Tests

### 2A. Source conversion tests

**Create:** `apps/api/tests/sources/test_conversion.py`

**TestConvertSourceToTopic:** simple source, flags, children (subtree), FSRS state, practices, reviews, entity relations, source_topics→entity_relations, prerequisites→entity_relations, not found (404)

**TestConvertSourceToPractice:** simple source, flags, FSRS, reviews, source_topics→practice_topics, blocked by children (409), not found (404)

### 2B. Practice conversion tests

**Create:** `apps/api/tests/practices/test_conversion.py`

**TestConvertPracticeToTopic:** simple practice, flags, FSRS, reviews, practice_sources→source_topics, practice_topics→entity_relations, not found (404)

**TestConvertPracticeToSource:** simple practice, flags, FSRS, reviews, practice_topics→source_topics, practice_sources→entity_relations, not found (404)

### 2C. Fix existing children test

**File:** `apps/api/tests/topics/test_conversion.py`

Update `test_convert_topic_with_children_blocked` to assert 409 with `"children"` in detail.

### Verify Phase 2
```bash
cd apps/api && uv run pytest tests/ -v
cd apps/api && uv run ruff check --fix && uv run ruff format
```

---

## Phase 3: Frontend — API Functions + Hooks

### 3A. Extract shared ConversionError

**Create:** `apps/web/src/utils/ConversionError.ts`

Extract the duplicate `ConversionError` class. Update existing `convertTopicToSource.ts` and `convertTopicToPractice.ts` to import from here.

### 3B. Source conversion hooks

**Create:** `apps/web/src/features/sources/api/convertSourceToTopic.ts`
- `convertSourceToTopic()` → `POST /sources/{id}/convert-to-topic/`
- `useConvertSourceToTopic()` — invalidates source, topic, practice, review keys

**Create:** `apps/web/src/features/sources/api/convertSourceToPractice.ts`
- `convertSourceToPractice()` → `POST /sources/{id}/convert-to-practice/`
- `useConvertSourceToPractice()` — invalidates source, practice, review keys

### 3C. Practice conversion hooks

**Create:** `apps/web/src/features/practices/api/convertPracticeToTopic.ts`
- `convertPracticeToTopic()` → `POST /practices/{id}/convert-to-topic/`
- `useConvertPracticeToTopic()` — invalidates practice, topic, review keys

**Create:** `apps/web/src/features/practices/api/convertPracticeToSource.ts`
- `convertPracticeToSource()` → `POST /practices/{id}/convert-to-source/`
- `useConvertPracticeToSource()` — invalidates practice, source, review keys

### Verify Phase 3
```bash
cd apps/web && pnpm run lint
```

---

## Phase 4: Frontend — Conversion Confirmation Dialog

### 4A. ConversionConfirmationDialog component

**Create:** `apps/web/src/components/ConversionConfirmationDialog.tsx`

Follows DeleteSourceDialog/DeleteTopicDialog pattern (open/onOpenChange props, Dialog+DialogContent+DialogHeader+DialogFooter).

**Props:**
- `open`, `onOpenChange`, `onConfirm`, `isPending`
- `sourceEntityType`, `targetEntityType`, `entityName`
- `migrated: { label: string; count: number }[]` — items with count > 0 shown
- `lost: string[]` — amber warning section
- `blockers: string[]` — red error section, disables confirm button

**Layout:**
- Header: "Convert to {targetType}?"
- Description: "'{entityName}' will become a {targetType}."
- Migrated section (if any): green list with counts
- Lost section (if any): amber warning list
- Blockers section (if any): red error list
- Footer: Cancel (outline) + Convert (default, disabled if blocked/pending)

### 4B. Conversion data helpers

**Create:** `apps/web/src/utils/conversionPreview.ts`

Pure functions computing dialog data from loaded entity objects:
- `getTopicToSourcePreview(topic)`
- `getTopicToPracticePreview(topic)`
- `getSourceToTopicPreview(source)`
- `getSourceToPracticePreview(source)`
- `getPracticeToTopicPreview(practice)`
- `getPracticeToSourcePreview(practice)`

Each returns `{ migrated, lost, blockers }` based on available counts (children_count, practices, sources, etc.).

### Verify Phase 4
```bash
cd apps/web && pnpm run lint
```

---

## Phase 5: Frontend — Integrate Dialog into Action Menus

### 5A. TopicActionMenu

**File:** `apps/web/src/features/topics/components/TopicActionMenu.tsx`

- Add dialog open state for each conversion direction
- Menu items open the dialog instead of firing mutation directly
- `onConfirm` callbacks perform mutation + navigate on success + toast on error
- Render `<ConversionConfirmationDialog>` instances after `<DeleteTopicDialog>`

### 5B. SourceActionMenu

**File:** `apps/web/src/features/sources/components/SourceActionMenu.tsx`

- Import conversion hooks, ConversionError, useNavigate, toast
- Add 2 dialog open states + 2 confirm handlers
- Add 2 `<DropdownMenuItem>` entries with RefreshCw icon before Delete
- Render 2 `<ConversionConfirmationDialog>` instances

### 5C. PracticeActionMenu

**File:** `apps/web/src/features/practices/components/PracticeActionMenu.tsx`

- Same pattern as SourceActionMenu
- Wrap return in fragment to include dialogs alongside dropdown

### Verify Phase 5
```bash
cd apps/web && pnpm run lint
```

**Manual testing:**
- Each entity's action menu shows conversion options
- Dialog shows correct preview data (migrated/lost/blockers)
- Blocked conversions disable the confirm button
- Successful conversion navigates to new entity
- Failed conversion shows toast error

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `apps/api/app/topics/service.py` (children block fix) |
| Modify | `apps/api/app/sources/service.py` (2 conversion functions) |
| Modify | `apps/api/app/practices/service.py` (2 conversion functions) |
| Modify | `apps/api/app/sources/router.py` (2 endpoints) |
| Modify | `apps/api/app/practices/router.py` (2 endpoints) |
| Modify | `apps/api/app/schemas/sources.py` (2 response schemas) |
| Modify | `apps/api/app/schemas/practices.py` (2 response schemas) |
| Modify | `apps/api/app/schemas/__init__.py` (exports) |
| Modify | `apps/api/tests/topics/test_conversion.py` (fix children test) |
| Create | `apps/api/tests/sources/test_conversion.py` |
| Create | `apps/api/tests/practices/test_conversion.py` |
| Create | `apps/web/src/utils/ConversionError.ts` |
| Create | `apps/web/src/features/sources/api/convertSourceToTopic.ts` |
| Create | `apps/web/src/features/sources/api/convertSourceToPractice.ts` |
| Create | `apps/web/src/features/practices/api/convertPracticeToTopic.ts` |
| Create | `apps/web/src/features/practices/api/convertPracticeToSource.ts` |
| Modify | `apps/web/src/features/topics/api/convertTopicToSource.ts` (use shared ConversionError) |
| Modify | `apps/web/src/features/topics/api/convertTopicToPractice.ts` (use shared ConversionError) |
| Create | `apps/web/src/components/ConversionConfirmationDialog.tsx` |
| Create | `apps/web/src/utils/conversionPreview.ts` |
| Modify | `apps/web/src/features/topics/components/TopicActionMenu.tsx` |
| Modify | `apps/web/src/features/sources/components/SourceActionMenu.tsx` |
| Modify | `apps/web/src/features/practices/components/PracticeActionMenu.tsx` |
