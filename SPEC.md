Goal: Any entity (Topic, Source, Practice) can be converted to any other entity type.

Conversion Paths

All 6 directions supported:
- Topic → Source (subtree), Topic → Practice (single)
- Source → Topic (subtree), Source → Practice (single)
- Practice → Topic (single), Practice → Source (single)

Field Mappings
┌───────────────────┬────────────────┬─────────────────┐
│     From → To     │ Primary Field  │ Secondary Field │
├───────────────────┼────────────────┼─────────────────┤
│ Topic → Source    │ name → title   │ notes → notes   │
├───────────────────┼────────────────┼─────────────────┤
│ Topic → Practice  │ name → prompt  │ notes → answer  │
├───────────────────┼────────────────┼─────────────────┤
│ Source → Topic    │ title → name   │ notes → notes   │
├───────────────────┼────────────────┼─────────────────┤
│ Source → Practice │ title → prompt │ notes → answer  │
├───────────────────┼────────────────┼─────────────────┤
│ Practice → Topic  │ prompt → name  │ answer → notes  │
├───────────────────┼────────────────┼─────────────────┤
│ Practice → Source │ prompt → title │ answer → notes  │
└───────────────────┴────────────────┴─────────────────┘
Flags (archived, inboxed), FSRS state, and reviews are always preserved.

Relationship Handling

- Hierarchy is preserved for subtree conversions (Topic↔Source)
- Practices are re-linked to the new entity
- Entity relations are remapped when the target type supports them; lost otherwise
- Source prerequisites are converted to entity relations (since only Sources support prerequisites)
- source_topics / practice_topics / practice_sources follow a "covering links" strategy — e.g., practice_topics become
source_topics when converting Practice→Source

Blocking Conditions

- Topic → Source: blocked if any subtree topic has covering sources
- Topic → Practice: blocked if topic has children, linked practices, or covering sources
- Source → Practice: blocked if source has children
- Source → Topic, Practice → Topic, Practice → Source: no blocking conditions

Confirmation Dialog

Every conversion shows a preview dialog (computed from already-loaded data) displaying:
- What will be migrated (with counts)
- What will be lost (warnings)
- Any blocking conditions (disables confirm button)

General Properties

- One-way, destructive (original entity deleted, new ID created)
- Atomic (single transaction)
- Available from each entity's action menu