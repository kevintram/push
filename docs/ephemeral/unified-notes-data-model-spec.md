# Unified Notes Data Model Spec

Status: Draft  
Date: February 20, 2026

## Problem
The current model splits core entities across `topics`, `sources`, and `practices`, with separate relationship tables and conversion flows between types. This creates duplicated logic, complex migrations, and type-fragmented behavior (especially around relationships and completion status).

The product direction is to treat everything as a note, then use tags to describe capabilities.

## Goals
- Use a single `notes` table as the canonical entity.
- Use fixed tags (`TOPIC`, `SOURCE`, `PRACTICE`) that are not mutually exclusive.
- Use one global tree hierarchy for all notes.
- Replace fragmented relationship tables with one `note_relations` table plus `relation_type`.
- Allow practices in generic relations.
- Move reviews to a single `reviews.note_id` foreign key.
- Support reading status and reading notes for every note.
- Treat Read as a reading-list view over notes (not just sources).
- Remove conversion endpoints and conversion UI.
- Enforce relation rules in app-layer and DB guardrails.

## Confirmed Product Decisions
1. Single notes table.
2. Unified content fields: `title` and `body`.
3. Fixed enum tags for now.
4. One global tree.
5. Practices can participate in generic relations.
6. One `note_relations` table with `relation_type`.
7. Notes can participate on either side; self-links allowed.
8. Reviews use `note_id`.
9. Every note carries `reading_status`.
10. Status set remains: `NEW`, `IN_PROGRESS`, `ON_HOLD`, `FINISHED`.
11. `reading_notes` becomes a note column.
12. Read page shows notes in reading list regardless of type.
13. Remove conversions.
14. ID remap is acceptable.
15. App-layer validation with DB guardrails for relation/tag invariants.

## Proposed Schema

### Enums
- `note_tag`: `TOPIC`, `SOURCE`, `PRACTICE`
- `reading_status`: `NEW`, `IN_PROGRESS`, `ON_HOLD`, `FINISHED`
- `note_relation_type`: `RELATED`, `PREREQUISITE`, `COVERS`, `ASSESSES`

### Core Tables

```sql
CREATE TYPE note_tag AS ENUM ('TOPIC', 'SOURCE', 'PRACTICE');
CREATE TYPE reading_status AS ENUM ('NEW', 'IN_PROGRESS', 'ON_HOLD', 'FINISHED');
CREATE TYPE note_relation_type AS ENUM ('RELATED', 'PREREQUISITE', 'COVERS', 'ASSESSES');

CREATE TABLE notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',

  parent_id BIGINT REFERENCES notes(id) ON DELETE RESTRICT,
  path ltree,

  fsrs_state_id BIGINT UNIQUE REFERENCES fsrs_states(id) ON DELETE SET NULL,

  reading_status reading_status NOT NULL DEFAULT 'NEW',
  reading_notes TEXT NOT NULL DEFAULT '',
  in_reading_list BOOLEAN NOT NULL DEFAULT false,

  archived BOOLEAN NOT NULL DEFAULT false,

  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE note_tags (
  note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag note_tag NOT NULL,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (note_id, tag)
);

CREATE TABLE note_relations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  to_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  relation_type note_relation_type NOT NULL,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_note_relation UNIQUE (from_id, to_id, relation_type)
);
```

Notes:
- Self-links are intentionally allowed.
- `in_reading_list` is an explicit membership field for the Read page.
- `reading_status` exists on every note, independent of tags.

### Reviews
- Add `reviews.note_id BIGINT REFERENCES notes(id) ON DELETE CASCADE`.
- Keep existing review before/after FSRS snapshot fields.
- Deprecate and remove `topic_id`, `source_id`, `practice_id` after cutover.

### Indexes
- `notes(user_id)`
- `notes(parent_id)`
- `notes USING GIST(path)`
- `notes(user_id, in_reading_list, reading_status)`
- `notes(fsrs_state_id)`
- `note_tags(tag, note_id)` and `note_tags(note_id)`
- `note_relations(from_id)`, `note_relations(to_id)`
- `note_relations(relation_type, from_id)`
- `reviews(note_id)`

### Triggers/Functions
- Reuse `update_updated_at_column()` for `notes` and `note_relations`.
- Add `compute_note_path`, `maintain_note_path`, and descendant path update trigger (same pattern as topic/source ltree).
- Update orphaned `fsrs_states` cleanup to reference `notes`.

## Validation (Phase 1)
Validation is enforced in API/service code, with DB triggers as guardrails for
relation/tag invariants.

### Tag Rules
- A note may have any combination of tags.
- Tags are capability markers, not entity identity.

### Relation Rules (App-Layer)
- `RELATED`: any note -> any note.
- `PREREQUISITE`: any note -> any note.
- `COVERS`: relation source note (`from_id`) must include `SOURCE` tag.
- `ASSESSES`: relation source note (`from_id`) must include `PRACTICE` tag.

DB guardrails:
- For `COVERS`, `from_id` must have `SOURCE` and `to_id` must have `TOPIC`.
- For `ASSESSES`, `from_id` must have `PRACTICE` and `to_id` must have `TOPIC` or `SOURCE`.
- Tag removal is blocked when dependent relations would become invalid.

## Mapping from Legacy Model

### Entity Tables
- `topics.name` -> `notes.title`, `topics.notes` -> `notes.body`, add tag `TOPIC`.
- `sources.title` -> `notes.title`, `sources.notes` -> `notes.body`, add tag `SOURCE`.
- `sources.status` -> `notes.reading_status`, `sources.progress_note` -> `notes.reading_notes`.
  - legacy `DROPPED` maps to `ON_HOLD`.
- `practices.prompt` -> `notes.title`, `practices.answer` -> `notes.body`, add tag `PRACTICE`.

### Hierarchy
- Topic/source parent trees map into one global `notes.parent_id/path` tree.
- Practice rows become root notes unless explicitly re-parented later.

### Relationships
- `entity_relations` -> `note_relations` with `relation_type='RELATED'`.
- `source_prerequisites` -> `note_relations` with `relation_type='PREREQUISITE'`.
- `source_topics` -> `note_relations` with `relation_type='COVERS'`.
- `practice_topics` and `practice_sources` -> `note_relations` with `relation_type='ASSESSES'`.

### Reviews
- `reviews.topic_id/source_id/practice_id` map to `reviews.note_id` via legacy-to-note ID map.

## API Surface (Target)
- New canonical endpoints centered on `/notes`.
- Tag operations:
  - add/remove/list tags on a note.
- Relation operations:
  - add/remove/list note relations filtered by type and direction.
- Review operations:
  - create/update/list by `note_id`.
- Read list operations:
  - toggle `in_reading_list`
  - update `reading_status` and `reading_notes` for any note.

Legacy `/topics`, `/sources`, `/practices` endpoints are transitional only and should be deprecated.

## Read Page Behavior (Target)
- Data source: notes where `in_reading_list = true` and `archived = false`.
- Group by `reading_status` tabs:
  - Read: `NEW` + `IN_PROGRESS`
  - On Hold: `ON_HOLD`
  - Finished: `FINISHED`
- All note types are eligible; optional UI filter by tag can be added later.

## Conversion Removal
- Remove all convert endpoints:
  - topic -> source/practice
  - source -> topic/practice
  - practice -> topic/source
- Remove corresponding web menu actions and preview flows.
- Replacement behavior: modify tags and relations on the same note.

## Non-Goals
- Preserving old entity IDs.
- Maintaining old conversion semantics.

## Acceptance Criteria
- All new entities are created in `notes`.
- A note can carry multiple tags simultaneously.
- Global parent/child tree works across all notes.
- Reviews link through `reviews.note_id` only.
- Read page works for any tagged note type.
- Conversion endpoints and UI are removed.
- Legacy entity tables are no longer authoritative.
