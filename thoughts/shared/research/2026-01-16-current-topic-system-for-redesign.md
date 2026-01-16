# Current Topic System Implementation Analysis

---
date: 2026-01-16T21:18:50Z
researcher: Claude
git_commit: aee2c5f5239255aec7d60c4cc83d90a78f31eaee
branch: prototype/rich-schema
repository: prototype-rich-schema
topic: "Current functionality related to topic redesign (Sources, Practices, rich schema)"
tags: [research, codebase, topics, reviews, fsrs, schema-redesign]
status: complete
last_updated: 2026-01-16
last_updated_by: Claude
---

## Research Question

Research the current codebase functionality that relates to the redesign specified in `topic-design-problem.md`, `topic-schema.md`, and `topic-api-design.md`. The redesign introduces three distinct entity types (Topics, Sources, Practices) to replace the current single "Topic" entity that conflates concepts, practices, and source materials.

## Summary

The current system uses a **single `Topic` entity** for all learning items, with two relationship types:
1. **Parent/Child hierarchy** via a closure table (`topics_closure`) supporting DAG (Directed Acyclic Graph) with multiple parents
2. **Related topics** via a junction table (`topic_other_relations`) for non-hierarchical associations

Reviews are **topic-centric** - each review belongs to exactly one topic, and FSRS state is stored directly on the Topic model. The redesign will:
- Split Topic into three entities: Topic, Source, Practice
- Migrate from graph (closure table) to tree structure (single parent_id)
- Extract FSRS state into a shared `fsrs_states` table
- Make reviews polymorphic (can belong to any entity type)

---

## Detailed Findings

### 1. Current Topic Model

**File:** `apps/api/app/models/topics.py:31-127`

The Topic model is the central entity with FSRS fields embedded directly:

```python
class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int]
    user_id: Mapped[str]
    name: Mapped[str]
    notes: Mapped[str]

    # FSRS State (embedded on Topic)
    stability: Mapped[float | None]
    difficulty: Mapped[float | None]
    state: Mapped[str]  # LEARNING, REVIEW, RELEARNING
    step: Mapped[int | None]
    last_reviewed_at: Mapped[date | None]
    srs_enabled: Mapped[bool]

    # Inherited FSRS fields (from parent topics)
    inherited_stability: Mapped[float | None]
    inherited_difficulty: Mapped[float | None]
    inherited_state: Mapped[str | None]
    inherited_step: Mapped[int | None]
    inherited_last_review: Mapped[date | None]

    # Status flags
    archived: Mapped[bool]
    inboxed: Mapped[bool]

    # Computed properties
    scheduled_at: Mapped[date | None]  # column_property from Review
    retrievability: float | None  # hybrid_property

    # Relationships
    parents: Mapped[list["Topic"]]  # via topics_closure, depth=1
    children: Mapped[list["Topic"]]  # via topics_closure, depth=1
    related_outgoing: Mapped[list["Topic"]]  # via topic_other_relations
    related_incoming: Mapped[list["Topic"]]  # via topic_other_relations
    reviews: Mapped[list["Review"]]
```

**Key differences from redesign:**
- FSRS state embedded on Topic vs. shared `fsrs_states` table
- Topics have `inherited_*` fields for FSRS inheritance from parents (not in redesign)
- Multiple parents supported (DAG) vs. single parent (tree)
- No `title` field (uses `name`) - Sources will use `title`
- No `prompt`/`answer` fields - Practices will have these

### 2. Current Closure Table (Graph Structure)

**File:** `apps/api/app/models/topics.py:129-161`

```python
t_topics_closure = Table(
    "topics_closure",
    Base.metadata,
    Column("ancestor", BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
    Column("descendant", BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
    Column("depth", Integer, server_default="0", primary_key=True),
    Column("count", Integer, nullable=False, server_default="1"),
    # ...timestamps
    CheckConstraint("count <= depth OR depth = 0", name="max_paths"),
)
```

**Key aspects:**
- Composite primary key: `(ancestor, descendant, depth)`
- `count` tracks multiple paths in DAG
- Database functions handle relationship operations: `insert_relationship()`, `delete_relationship()`
- Self-referential row created on topic insert (depth=0)

**Migration impact:**
- Closure table will be deleted
- Topics with multiple parents need resolution (pick one, move others to related)
- New `parent_id` foreign key will be added directly to topics table

### 3. Current Related Topics (Non-Hierarchical)

**File:** `apps/api/app/models/topics.py:163-192`

```python
t_topic_other_relations = Table(
    "topic_other_relations",
    Base.metadata,
    Column("from_topic_id", BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
    Column("to_topic_id", BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
    # ...timestamps
)
```

**Key aspects:**
- Directional relationship (from -> to)
- Separate `related_outgoing` and `related_incoming` relationships on Topic model
- Self-reference constraint prevents topic from being related to itself

**Migration impact:**
- Will be replaced by `entity_relations` table supporting Topic-Topic, Topic-Source, Source-Topic, Source-Source relationships
- Directionality preserved in new design

### 4. Current Review Model

**File:** `apps/api/app/models/reviews.py:26-83`

```python
class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int]
    review_session_id: Mapped[int | None]  # Optional grouping
    topic_id: Mapped[int]  # Required - always belongs to a topic
    user_id: Mapped[str]

    scheduled_at: Mapped[date | None]
    completed_at: Mapped[date | None]
    effective_date: Mapped[date]  # computed: coalesce(completed_at, scheduled_at)
    description: Mapped[str]
    notes: Mapped[str]
    rating: Mapped[str | None]  # miss, hard, good, easy

    # FSRS state snapshots (before/after)
    stability_before: Mapped[float | None]
    difficulty_before: Mapped[float | None]
    state_before: Mapped[str | None]
    step_before: Mapped[int | None]
    due_before: Mapped[date | None]

    stability_after: Mapped[float | None]
    difficulty_after: Mapped[float | None]
    state_after: Mapped[str | None]
    step_after: Mapped[int | None]
    due_after: Mapped[date | None]

    # Relationships
    review_session: Mapped["ReviewSession | None"]
    topic: Mapped["Topic"]
```

**Key differences from redesign:**
- `topic_id` is required (not nullable) - reviews are topic-only
- New design has polymorphic reviews via association tables (`topic_reviews`, `source_reviews`, `practice_reviews`)
- FSRS snapshots stored on review itself vs. referencing shared `fsrs_states`

### 5. FSRS Implementation

**File:** `apps/api/app/routers/reviews.py:1-105`

The FSRS library is used directly in the reviews router:

```python
from fsrs import Card, Rating as FSRSRating, Scheduler, State as FSRSState

def map_rating_to_fsrs(rating: str) -> FSRSRating:
    mapping = {
        "miss": FSRSRating.Again,
        "hard": FSRSRating.Hard,
        "good": FSRSRating.Good,
        "easy": FSRSRating.Easy,
    }
    return mapping[rating]

def map_state_to_fsrs(state: str) -> FSRSState:
    mapping = {
        "LEARNING": FSRSState.Learning,
        "REVIEW": FSRSState.Review,
        "RELEARNING": FSRSState.Relearning,
    }
    return mapping[state]
```

**Key FSRS workflow:**
1. Review is created with `topic_id`
2. Before state captured from Topic's current FSRS fields
3. FSRS scheduler calculates new state based on rating
4. After state stored on Review AND Topic updated
5. `replay_subsequent_reviews()` function handles FSRS recalculation when historical reviews change

**File:** `apps/api/app/utils/retrievability.py:1-67`

```python
FSRS_DECAY = -0.1542
FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1  # approximately 8.96

def calculate_retrievability(
    stability: float | None,
    last_reviewed_at: date | None,
    current_date: date | None = None,
) -> float | None:
    """R = (1 + FACTOR * elapsed_days / stability) ^ DECAY"""
```

**Migration impact:**
- FSRS logic remains similar but operates on shared `fsrs_states` table
- Retrievability calculation will be reused unchanged
- Review creation will need polymorphic handling

### 6. Current Pydantic Schemas

**File:** `apps/api/app/schemas/topics.py:10-130`

Key schemas:
- `TopicBase`: Core fields (name, notes, stability, difficulty, state, etc.)
- `TopicRead`: Adds id, timestamps, scheduled_at, retrievability
- `TopicReadWithRelationships`: Adds parents, children lists
- `TopicRelatedRead`: Adds relationship_direction enum
- `TopicCreate`, `TopicUpdate`: Create/update payloads
- `TopicChildRelationshipCreate`, `TopicParentRelationshipCreate`: Mutually exclusive id-or-inline-create pattern
- `TopicOtherRelationshipCreate`: Same pattern for related topics

**Key pattern - Mutually exclusive fields:**
```python
class TopicChildRelationshipCreate(BaseModel):
    child_id: int | None = None
    child: "TopicCreate | None" = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self):
        if self.child_id is not None and self.child is not None:
            raise ValueError("Cannot provide both child_id and child")
        if self.child_id is None and self.child is None:
            raise ValueError("Must provide either child_id or child")
        return self
```

**Migration impact:**
- New design simplifies to ID-only relationship payloads (no inline create)
- Separate schemas for Topic, Source, Practice entities
- `*SummaryRead` schemas with counts instead of full relationships for list endpoints
- `*DetailRead` schemas with full relationships for detail endpoints

### 7. Current API Endpoints

**File:** `apps/api/app/routers/topics.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/topics/search/` | GET | Search with filters (addable_as_parent_to, addable_as_child_to, addable_as_related_to) |
| `/topics/` | GET | List topics with filters (inboxed, archived, root, has_stability, srs_enabled, scheduled) |
| `/topics/` | POST | Create topic |
| `/topics/{id}/` | GET | Get topic with parents/children |
| `/topics/{id}/` | POST | Update topic |
| `/topics/{id}/` | DELETE | Delete topic |
| `/topics/{id}/parents/` | GET | Get topic's parents |
| `/topics/{id}/children/` | GET | Get topic's children |
| `/topics/{id}/related/` | GET | Get related topics with direction |
| `/topics/{parent_id}/children/` | POST | Add child (existing or new) |
| `/topics/{child_id}/parents/` | POST | Add parent (existing or new) |
| `/topics/{parent_id}/children/{child_id}/` | DELETE | Remove child relationship |
| `/topics/{child_id}/parents/{parent_id}/` | DELETE | Remove parent relationship |
| `/topics/{from_id}/related/` | POST | Add related topic |
| `/topics/{from_id}/related/{to_id}/` | DELETE | Remove related relationship |
| `/topics/{id}/review-sessions/` | GET | Get review sessions for topic |

**Migration impact:**
- Similar endpoint structure for each entity type
- Tree structure simplifies parent operations (PATCH with parent_id instead of POST endpoints)
- New relationship endpoints for Source-Topic, Practice-Topic, Practice-Source, Source-Prerequisites

### 8. Database Migrations History

Key migrations showing schema evolution:

| Migration | Purpose |
|-----------|---------|
| `20250822153137_remote_schema.sql` | Initial schema with `topics`, `practice_cards` |
| `20250907140303_dag.sql` | Added `topics_closure` for DAG hierarchy |
| `20250919164834_notes-only.sql` | Dropped `practice_cards` (early simplification) |
| `20250926202057_topic-todos.sql` | Added todos-topics junction |
| `20251105194610_srs.sql` | Added FSRS fields to topics, renamed tables |
| `20251121120000_rename_todos_reviews.sql` | `reviews` -> `topic_reviews`, `todos` -> `reviews` |
| `20251218120000_refactor_reviews.sql` | `reviews` -> `review_sessions`, `topic_reviews` -> `reviews` |
| `20251210120000_add_topic_other_relations.sql` | Added `topic_other_relations` junction table |
| `20251222120000_remove_due_add_last_reviewed.sql` | Added `last_reviewed_at` to topics |

**Historical note:** The system previously had `practice_cards` but they were removed. The redesign reintroduces a similar concept as `practices`.

### 9. Frontend Implementation (Web)

Key files:

| Path | Description |
|------|-------------|
| `apps/web/src/features/topics/types/topic.types.ts` | TypeScript Topic type definitions |
| `apps/web/src/features/topics/types/topic.schemas.ts` | Valibot validation schemas |
| `apps/web/src/features/topics/api/` | 12+ API function files for topic operations |
| `apps/web/src/features/topics/components/` | Topic UI components |
| `apps/web/src/features/reviews/types/` | Review type definitions |
| `apps/web/src/features/reviews/api/` | 11+ API function files for review operations |
| `apps/web/src/features/reviews/components/` | Review UI components |

**Key frontend patterns:**
- TanStack Query for data fetching with cache invalidation
- Valibot for schema validation
- Feature-based directory structure
- `RelationshipDirection` enum for bidirectional relationship handling

---

## Code References

### Models
- Topic model: `apps/api/app/models/topics.py:31-127`
- Closure table: `apps/api/app/models/topics.py:129-161`
- Other relations table: `apps/api/app/models/topics.py:163-192`
- Review model: `apps/api/app/models/reviews.py:26-83`
- Review Session model: `apps/api/app/models/review_sessions.py`

### Schemas
- Topic schemas: `apps/api/app/schemas/topics.py:10-130`
- Review schemas: `apps/api/app/schemas/reviews.py:13-118`
- Review Session schemas: `apps/api/app/schemas/review_sessions.py`

### Routers
- Topics router: `apps/api/app/routers/topics.py`
- Reviews router: `apps/api/app/routers/reviews.py`
- Review Sessions router: `apps/api/app/routers/review_sessions.py`
- Review Entries router: `apps/api/app/routers/review_entries.py`

### Utilities
- Retrievability calculation: `apps/api/app/utils/retrievability.py:9-33`

### Database Functions (PostgreSQL)
- `insert_relationship(parent, child)`: `supabase/migrations/20250907140303_dag.sql:49-74`
- `delete_relationship(parent, child)`: `supabase/migrations/20250907140303_dag.sql:29-47`
- `get_potential_parents(topic_id, search_query)`: `supabase/migrations/20250926132202_enhanced_add_relationship.sql:7-26`
- `get_potential_children(topic_id, search_query)`: `supabase/migrations/20250926132202_enhanced_add_relationship.sql:28-53`

---

## Architecture Documentation

### Current Data Flow

```
User creates Topic
    ├── Topic stored with embedded FSRS state (stability=null, state=LEARNING)
    ├── Reflexive path created in topics_closure (ancestor=id, descendant=id, depth=0)
    └── If parent specified, insert_relationship() called

User reviews Topic
    ├── Review created with topic_id
    ├── Before state captured from Topic
    ├── FSRS scheduler calculates new state
    ├── After state stored on Review
    ├── Topic updated with new FSRS state
    └── If historical, replay_subsequent_reviews() recalculates chain

User adds parent/child relationship
    ├── insert_relationship(parent_id, child_id) called
    ├── Cycle detection via closure table query
    ├── Cross-product inserted: (all ancestors) x (all descendants)
    └── Count incremented if relationship exists via different path
```

### Proposed Data Flow (from redesign docs)

```
User creates Topic/Source/Practice
    ├── Entity stored with optional fsrs_state_id
    ├── If srs_enabled=true, fsrs_states record created
    └── Simple parent_id for hierarchy (Topics, Sources only)

User reviews any entity
    ├── Review created (polymorphic via association table)
    ├── Before state captured from entity's fsrs_states
    ├── FSRS scheduler calculates new state
    ├── After state stored on Review
    └── Entity's fsrs_states updated

User sets parent (Topics, Sources)
    ├── PATCH entity with parent_id
    ├── Cycle detection via parent chain traversal (simpler than closure)
    └── No multi-parent support
```

---

## Migration Considerations

### Data Migration Steps

1. **Resolve multi-parent topics**
   - Query: `SELECT descendant FROM topics_closure GROUP BY descendant HAVING COUNT(*) > 1 WHERE depth = 1`
   - For each: keep primary parent, move others to `entity_relations`

2. **Add parent_id column to topics**
   - Extract from closure table: `SELECT descendant, ancestor FROM topics_closure WHERE depth = 1`
   - Populate parent_id

3. **Create new tables**
   - `sources`: Similar to topics but with `title` instead of `name`
   - `practices`: With `prompt` and `answer` fields
   - `fsrs_states`: Extract FSRS fields from topics
   - `entity_relations`: Replace `topic_other_relations`
   - `source_topics`, `source_prerequisites`, `practice_topics`, `practice_sources`
   - `topic_reviews`, `source_reviews`, `practice_reviews`

4. **Migrate FSRS state**
   - For each topic with srs_enabled=true, create fsrs_states record
   - Link via fsrs_state_id

5. **Migrate reviews**
   - Create `topic_reviews` entries for all existing reviews
   - Keep review data in shared `reviews` table

6. **Cleanup**
   - Drop `topics_closure` table
   - Drop `topic_other_relations` table
   - Remove FSRS fields from topics table
   - Remove `inherited_*` fields from topics table

### Breaking Changes

- API endpoints will change significantly
- Frontend will need updates for new entity types
- Multi-parent topics will lose secondary parents
- FSRS inheritance from parents removed (no more `inherited_*` fields)

---

## Related Research

None found in `thoughts/` directory. This is the first research document for this redesign.

---

## Open Questions

1. **FSRS Inheritance**: The current system has `inherited_*` fields for FSRS state inheritance from parent topics. The redesign removes this. Is this intentional?

2. **Practice Cards History**: The system previously had `practice_cards` (dropped in migration `20250919164834`). Are there any lessons learned from that implementation?

3. **Multi-Parent Resolution**: The design doc mentions three options (pick one, duplicate, user-guided). Which approach should be used for migration?

4. **Review Replay**: The current system replays reviews when historical data changes. Will this mechanism work with the new polymorphic reviews?

5. **Existing Data**: How much existing data has multi-parent relationships that will need resolution?
