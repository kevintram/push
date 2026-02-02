## Dialog Relationship Refactor + Cross-Entity SRS Inherit

Status: Draft

### Problem
- Add dialogs take a `context` prop that mixes creation intent, relationship metadata, and inheritance data.
- The name `context` is easily confused with React Context usage.
- Cross-entity creation (Topic <-> Source) does not expose "Inherit SRS", and the backend only inherits from same-type parents.

### Goals
- Rename `context` to a clearer name and split responsibilities:
  - `relationship` describes *where* and *how* the entity will be created/linked.
  - `inherit` carries optional SRS inheritance data.
- Enable "Inherit SRS" for cross-entity creation (Topic <-> Source, Topic/Source <-> Practice).
- Use `inherit_fsrs` consistently; avoid ad-hoc inheritance fields in dialog payloads.
- Centralize the `FsrsState` type to avoid duplicates.

### Non-Goals
- Full dialog rewrite (Option B).
- Changing existing parent/child inheritance semantics.
- Changing how FSRS is computed or scheduled beyond inheritance.

### Proposed API (Frontend)

Shared type (centralized, imported by dialogs/panels):
```
type FsrsState = {
  stability: number | null
  difficulty: number | null
  state: LearningState | null
  step: number | null
  lastReviewedAt: string | null
}
```

Notes:
- This is a thin projection of an entity's FSRS state (not the full record).
- It does not include `srs_enabled`, `fsrs_state_id`, or `inherited_*` fields.
- `lastReviewedAt` maps to `last_reviewed_at` from the entity read models.

AddTopicDialog:
```
type TopicRelationship =
  | { kind: 'standalone' }
  | { kind: 'child'; parentTopicId: number }
  | { kind: 'parent'; childTopicId: number }
  | { kind: 'related'; fromTopicId: number }
  | { kind: 'source'; sourceId: number }
  | { kind: 'practice'; practiceId: number }
  | { kind: 'sourcePrerequisite'; sourceId: number }
  | { kind: 'sourceRelated'; sourceId: number }

type InheritOptions = { fsrsState?: FsrsState | null }

interface AddTopicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  relationship?: TopicRelationship
  inherit?: InheritOptions
  onSuccess?: (topicId: number) => void
}
```

AddSourceDialog:
```
type SourceRelationship =
  | { kind: 'standalone' }
  | { kind: 'child'; parentSourceId: number }
  | { kind: 'parent'; childSourceId: number }
  | { kind: 'topic'; topicId: number }
  | { kind: 'practice'; practiceId: number }
  | { kind: 'topicRelated'; topicId: number }
  | { kind: 'sourceRelated'; sourceId: number }
  | { kind: 'sourcePrerequisite'; sourceId: number }

type InheritOptions = { fsrsState?: FsrsState | null }

interface AddSourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  relationship?: SourceRelationship
  inherit?: InheritOptions
  onSuccess?: (sourceId: number) => void
}
```

AddPracticeDialog:
```
type PracticeRelationship =
  | { kind: 'standalone' }
  | { kind: 'topic'; topicId: number }
  | { kind: 'source'; sourceId: number }

type InheritOptions = { fsrsState?: FsrsState | null }

interface AddPracticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  relationship?: PracticeRelationship
  inherit?: InheritOptions
  onSuccess?: (practiceId: number) => void
}
```

### UI Behavior
- "Inherit SRS" toggle is shown when `inherit?.fsrsState` exists.
- Toggle sets `inherit_fsrs` in the create payload.
- Inheritance is applied when the source entity has FSRS state, regardless of the new entity’s `srs_enabled` value.
- If `inherit_fsrs` is true and `srs_enabled` is false on the new entity, a FSRS state record is still created to store inherited fields (with `srs_enabled` false).

### Backend Behavior
- When creating a Topic inline from a Source (`POST /sources/{id}/topics/` with `topic`), if `inherit_fsrs` is true, copy FSRS from the source into the new topic’s `inherited_*` fields.
- When creating a Source inline from a Topic (`POST /topics/{id}/sources/` with `source`), if `inherit_fsrs` is true, copy FSRS from the topic into the new source’s `inherited_*` fields.
- When creating a Practice inline from a Topic/Source (`POST /topics/{id}/practices/` or `/sources/{id}/practices/`), if `inherit_fsrs` is true, copy FSRS from the topic/source into the new practice’s `inherited_*` fields.
- When creating a Topic/Source inline from a Practice (`POST /practices/{id}/topics/` or `/practices/{id}/sources/`), if `inherit_fsrs` is true, copy FSRS from the practice into the new topic/source’s `inherited_*` fields.
- No change to same-type parent/child inheritance.

### Acceptance Criteria
- The dialogs use `relationship` + `inherit` (no `context` prop).
- Inherit toggle appears for:
  - Topic children/related (existing)
  - Source children (existing)
  - Source -> Topic create (new)
  - Topic -> Source create (new)
- Topic/Source -> Practice create (new)
- Practice -> Topic/Source create (new)
- Cross-entity inheritance sets `inherit_fsrs` and is applied server-side.
- Inheritance runs even when the new entity’s `srs_enabled` is false (as long as the source entity has FSRS state).
- Existing create flows still work without behavior regressions.
