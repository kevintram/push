# Robust Entity Conversion — Implementation Plan

## Summary

Expand entity conversion from 2 paths (Topic→Source, Topic→Practice) to all 6 bidirectional paths, add a children-blocking condition to Topic→Practice, and introduce a confirmation dialog with preview before every conversion.

**Status: ALL PHASES COMPLETE — Verified 2026-01-30**
- Backend: 168/168 tests pass (44 conversion-specific)
- Frontend: tsc + biome lint clean (94 pre-existing warnings only)

---

## Completed Phases

### Phase 1: Backend — Fix + New Conversion Logic ✅
All 6 conversion paths implemented in the API with proper field mappings, relationship handling, and blocking conditions. Router endpoints and response schemas added for sources and practices.

### Phase 2: Backend Tests ✅
Full test coverage: 9 tests for Source→Topic, 6 for Source→Practice, 6 for Practice→Topic, 6 for Practice→Source. All 168 tests pass.

### Phase 3: Frontend — API Functions + Hooks ✅
Shared `ConversionError` class, 4 new API files (source/practice conversions), 2 updated topic files. Each hook invalidates all affected query keys on success.

### Phase 4: Frontend — Conversion Confirmation Dialog ✅
`ConversionConfirmationDialog.tsx` with migrated/lost/blocker sections. `conversionPreview.ts` with 6 pure preview functions.

### Phase 5: Frontend — Integrate Dialog into Action Menus ✅
All 3 action menus (Topic, Source, Practice) show conversion options with dialog-first flow. Confirm triggers mutation → success navigates to new entity → error shows toast/inline.

---

## Manual Testing Checklist

- [ ] Each entity's action menu shows conversion options
- [ ] Dialog shows correct preview data (migrated/lost/blockers)
- [ ] Blocked conversions disable the confirm button
- [ ] Successful conversion navigates to new entity
- [ ] Failed conversion shows toast error
