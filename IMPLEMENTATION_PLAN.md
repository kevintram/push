# Robust Entity Conversion — Implementation Plan

## Summary

Expand entity conversion from 2 paths (Topic→Source, Topic→Practice) to all 6 bidirectional paths, add a children-blocking condition to Topic→Practice, and introduce a confirmation dialog with preview before every conversion.

---

## Phase 1: Backend — Fix + New Conversion Logic ✅ COMPLETED

All 6 conversion paths implemented in the API with proper field mappings, relationship handling, and blocking conditions. Router endpoints and response schemas added for sources and practices.

## Phase 2: Backend Tests ✅ COMPLETED

Full test coverage: 9 tests for Source→Topic, 6 for Source→Practice, 6 for Practice→Topic, 6 for Practice→Source. All 168 tests pass.

## Phase 3: Frontend — API Functions + Hooks ✅ COMPLETED

- Extracted shared `ConversionError` class to `apps/web/src/utils/ConversionError.ts`
- Created `convertSourceToTopic.ts` and `convertSourceToPractice.ts` in sources/api/
- Created `convertPracticeToTopic.ts` and `convertPracticeToSource.ts` in practices/api/
- Updated existing `convertTopicToSource.ts` and `convertTopicToPractice.ts` to use shared ConversionError
- Each hook invalidates all affected query keys (source, topic, practice, review) on success

## Phase 4: Frontend — Conversion Confirmation Dialog ✅ COMPLETED

- Created `ConversionConfirmationDialog.tsx` — reusable dialog showing migrated/lost/blocker sections with colored icons (green/amber/red)
- Created `conversionPreview.ts` — 6 pure functions computing preview data from loaded entity objects using available counts (children_count, sources_count, topics_count, related counts, prerequisites_count)

## Phase 5: Frontend — Integrate Dialog into Action Menus ✅ COMPLETED

- **TopicActionMenu**: Replaced direct mutation calls with dialog-first flow; renders 2 ConversionConfirmationDialog instances
- **SourceActionMenu**: Added Convert to Topic / Convert to Practice menu items with dialog confirmation
- **PracticeActionMenu**: Added Convert to Topic / Convert to Source menu items with dialog confirmation; wrapped in fragment for dialogs

All menus: click opens dialog → confirm triggers mutation → success navigates to new entity → error shows toast.

**Verify:** `pnpm run lint` passes (tsc + biome clean, 94 pre-existing warnings only).

---

## Manual Testing Checklist

- [ ] Each entity's action menu shows conversion options
- [ ] Dialog shows correct preview data (migrated/lost/blockers)
- [ ] Blocked conversions disable the confirm button
- [ ] Successful conversion navigates to new entity
- [ ] Failed conversion shows toast error

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
