# Implementation Plan: Dialog Relationship Refactor + Cross-Entity SRS Inherit

## Phase 1: Types and Props
- Add `relationship` and `inherit` props to `AddTopicDialog`, `AddSourceDialog`, and `AddPracticeDialog`.
- Replace existing `context` types with new `relationship` types.
- Update dialog internals to use `relationship` (for routing/mutations) and `inherit` (for SRS toggle visibility).
- Add `inherit_fsrs: shouldInherit` to topic/source/practice create payloads; remove reliance on manual `inherited_*` fields in dialog payloads.
- Centralize `FsrsState` into a shared type module and update imports.

Files:
- `apps/web/src/features/topics/components/AddTopicDialog.tsx`
- `apps/web/src/features/sources/components/AddSourceDialog.tsx`
- `apps/web/src/features/practices/components/AddPracticeDialog.tsx`
- `apps/web/src/models/learnable.types.ts` (or new shared module)
- `apps/web/src/features/topics/types/api.types.ts`
- `apps/web/src/features/sources/types/source.types.ts`
- `apps/web/src/features/practices/types/api.types.ts`

## Phase 2: Call-Site Updates
- Replace `context` prop usage with `relationship` + `inherit` at all call sites.
- Pass `inherit.fsrsState` into cross-entity panels:
  - Source -> Topics: use source SRS data.
  - Topic -> Sources: use topic SRS data.
  - Topic -> Practices: use topic SRS data.
  - Source -> Practices: use source SRS data.
  - Practice -> Topics/Sources: use practice SRS data.
- Keep same behavior for existing child/related panels.

Files (expected):
- `apps/web/src/features/sources/components/SourceTopicsPanel.tsx`
- `apps/web/src/features/topics/components/TopicSourcesPanel.tsx`
- `apps/web/src/features/sources/components/SourceChildrenPanel.tsx`
- `apps/web/src/features/topics/components/TopicChildrenPanel.tsx`
- `apps/web/src/features/topics/components/TopicRelatedPanel.tsx`
- `apps/web/src/features/sources/components/SourceRelatedPanel.tsx`
- `apps/web/src/features/sources/components/SourcePrerequisitesPanel.tsx`
- `apps/web/src/features/topics/components/TopicPracticesPanel.tsx`
- `apps/web/src/features/sources/components/SourcePracticesPanel.tsx`
- `apps/web/src/features/practices/components/PracticeTopicsPanel.tsx`
- `apps/web/src/features/practices/components/PracticeSourcesPanel.tsx`
- `apps/web/src/app/components/AppSidebar/CreateButton.tsx`

## Phase 3: Detail Page Wiring
- Compute `srsSource` once in `SourceDetail` and pass into `SourceTopicsPanel`.
- Reuse existing `srsSource` in `TopicDetail` and pass into `TopicSourcesPanel`.
- Pass topic/source SRS data into practice panels (and practice detail if needed).

Files:
- `apps/web/src/features/sources/components/SourceDetail/SourceDetail.tsx`
- `apps/web/src/features/topics/components/TopicDetail/TopicDetail.tsx`
- `apps/web/src/features/practices/components/PracticeDetail/PracticeDetail.tsx` (if needed)

## Phase 4: Backend Cross-Entity Inherit + SRS State Creation
- When `inherit_fsrs` is true, create a FSRS state record even if `srs_enabled` is false, and copy inherited fields from the source entity.
- Topic <- Source: `POST /sources/{id}/topics/`
- Source <- Topic: `POST /topics/{id}/sources/`
- Practice <- Topic: `POST /topics/{id}/practices/`
- Practice <- Source: `POST /sources/{id}/practices/`
- Topic <- Practice: `POST /practices/{id}/topics/`
- Source <- Practice: `POST /practices/{id}/sources/`
- Keep existing parent/child inherit behavior unchanged beyond the `inherit_fsrs` -> create FSRS state change.

Files:
- `apps/api/app/sources/service.py` (add logic in `add_source_topic` + `add_source_practice`)
- `apps/api/app/topics/service.py` (add logic in `add_topic_practice` + related endpoints)
- `apps/api/app/practices/service.py` (add logic in `add_practice_topic` + `add_practice_source`)
- `apps/api/app/sources/service.py` and `apps/api/app/topics/service.py` (create_* functions to allow FSRS state creation when `inherit_fsrs` is true even if `srs_enabled` is false)

## Phase 5: Tests
- Add API tests for cross-entity inherit:
  - Source -> Topic (`/sources/{id}/topics/`) with `inherit_fsrs: true`.
  - Topic -> Source (`/topics/{id}/sources/`) with `inherit_fsrs: true`.
  - Source -> Practice (`/sources/{id}/practices/`) with `inherit_fsrs: true`.
  - Topic -> Practice (`/topics/{id}/practices/`) with `inherit_fsrs: true`.
  - Practice -> Topic (`/practices/{id}/topics/`) with `inherit_fsrs: true`.
  - Practice -> Source (`/practices/{id}/sources/`) with `inherit_fsrs: true`.
- Ensure existing inherit tests still pass.

Files:
- `apps/api/tests/topics/test_crud.py`
- `apps/api/tests/sources/test_crud.py`
- `apps/api/tests/practices/test_crud.py` (or new)

## Validation
- Web: manual check that the toggle appears in cross-entity create dialogs (Topic/Source/Practice).
- API: run `uv run pytest` in `apps/api/`.
- Web lint: run `pnpm run lint` in `apps/web/` if needed.
