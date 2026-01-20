---
date: 2026-01-18T01:51:16Z
researcher: Claude
git_commit: abb6f7ab70163e5b3cc99b857db6f7673d3f0048
branch: prototype/rich-schema
repository: prototype-rich-schema
topic: "Current Implementation vs. Proposed Topic System Redesign"
tags: [research, codebase, topics, sources, practices, fsrs, schema-redesign]
status: complete
last_updated: 2026-01-17
last_updated_by: Claude
---

# Current Implementation vs. Proposed Topic System Redesign

## Research Question

Compile the relevant details of the current implementation in regards to the changes described in the topic redesign documents (`topic-design-problem.md`, `topic-schema.md`, `topic-api-design.md`).

## Summary

The current implementation uses a **single entity type (Topic)** with a **graph-based hierarchy** via a closure table, and **FSRS state stored directly on topics**. The proposed redesign introduces **three distinct entity types** (Topics, Sources, Practices) with a **tree-based hierarchy** (simple `parent_id`), and a **shared `fsrs_states` table** for orthogonal review tracking.

**Key changes required:**
1. Add new `sources` and `practices` tables
2. Convert topics from graph (closure table) to tree (`parent_id`)
3. Extract FSRS state to shared table
4. Create junction tables for new relationships
5. Extend `related` from topic-only to topic+source

---

## Detailed Findings

### 1. Current Entity Structure

#### Topics Table (Current)

**Location:** `apps/api/app/models/topics.py:31-127`

The `Topic` model contains:
- Core fields: `id`, `user_id`, `name`, `notes`
- Status flags: `archived`, `inboxed`, `srs_enabled`
- **FSRS state directly on entity:**
  - `stability`, `difficulty`, `state`, `step`, `last_reviewed_at`
  - `inherited_*` fields for hierarchy-inherited FSRS state
- Computed property: `retrievability` (hybrid property)
- Computed column: `scheduled_at` (min scheduled review date)
- Relationships: `reviews`, `parents`, `children`, `related_outgoing`, `related_incoming`

```python
# Current FSRS fields on Topic (lines 48-80)
stability: Mapped[float | None]
inherited_stability: Mapped[float | None]
inherited_difficulty: Mapped[float | None]
inherited_state: Mapped[str | None]
inherited_step: Mapped[int | None]
inherited_last_review: Mapped[date | None]
difficulty: Mapped[float | None]
state: Mapped[str]  # LEARNING, REVIEW, RELEARNING enum
step: Mapped[int | None]
last_reviewed_at: Mapped[date | None]
srs_enabled: Mapped[bool]
```

#### Sources Table (Proposed - Does Not Exist)

No `sources` table or model exists. The design proposes:
- Recursive nesting (book → chapter → section)
- Topics covered via `source_topics` junction
- Prerequisites via `source_prerequisites` junction
- FSRS state via shared `fsrs_states` table

#### Practices Table (Proposed - Does Not Exist)

No `practices` table or model exists. A historical `practice_cards` table existed but was dropped in migration `20250919164834_notes-only.sql`.

The design proposes:
- `prompt` and `answer` fields
- Topics assessed via `practice_topics` junction
- Sources assessed via `practice_sources` junction
- FSRS state via shared `fsrs_states` table

---

### 2. Current Relationship Structure

#### Graph-Based Hierarchy (Current - Closure Table)

**Location:** `apps/api/app/models/topics.py:129-161`

The current system uses a **closure table** (`topics_closure`) for parent/child relationships:

```python
t_topics_closure = Table(
    "topics_closure",
    Column("ancestor", BigInteger, ForeignKey("topics.id")),
    Column("descendant", BigInteger, ForeignKey("topics.id")),
    Column("depth", Integer),  # 1 = direct parent/child
    Column("count", Integer),  # Number of paths (DAG support)
)
```

**Key characteristics:**
- **Multiple parents allowed** (DAG, not tree)
- `depth=1` indicates direct parent/child relationship
- `count` tracks number of paths (for multi-path graphs)
- Database functions for insert/delete: `insert_relationship()`, `delete_relationship()`
- Reflexive self-loop on insert (trigger creates ancestor=descendant, depth=0)

**Migration:** `supabase/migrations/20250907140303_dag.sql`

#### Tree-Based Hierarchy (Proposed - Simple parent_id)

The proposed design uses a simple `parent_id` foreign key:
- At most one parent per topic/source
- Simpler traversal (no closure table queries)
- Requires migration to resolve multi-parent topics

#### Related Topics (Current - Topic-to-Topic Only)

**Location:** `apps/api/app/models/topics.py:163-191`

```python
t_topic_other_relations = Table(
    "topic_other_relations",
    Column("from_topic_id", BigInteger, ForeignKey("topics.id")),
    Column("to_topic_id", BigInteger, ForeignKey("topics.id")),
)
```

**Limitations:**
- Only topic-to-topic relations
- Directional (from → to)
- Cannot relate topics to sources (proposed feature)

**Migration:** `supabase/migrations/20251210120000_add_topic_other_relations.sql`

#### Entity Relations (Proposed - Topic + Source)

The proposed `entity_relations` table would:
- Support topic↔topic, topic↔source, source↔source
- Use nullable columns with check constraints
- Replace `topic_other_relations`

---

### 3. Current Review System

#### Review Model

**Location:** `apps/api/app/models/reviews.py:26-83`

Reviews are tied to topics:
```python
class Review(Base):
    topic_id: Mapped[int]  # Required FK to topics
    review_session_id: Mapped[int | None]  # Optional FK to sessions
    scheduled_at: Mapped[date | None]
    completed_at: Mapped[date | None]
    rating: Mapped[str | None]  # miss, hard, good, easy

    # FSRS snapshots (before/after)
    stability_before, stability_after
    difficulty_before, difficulty_after
    state_before, state_after
    step_before, step_after
    due_before, due_after
```

**Limitations:**
- Only supports topic reviews (`topic_id` required)
- No source or practice reviews

#### Proposed Review System

The proposed design:
- Shared `reviews` table with minimal association tables
- `topic_reviews`, `source_reviews`, `practice_reviews` for type-safe FKs
- Triggers to cascade review deletion when entity deleted

#### ReviewSession Model

**Location:** `apps/api/app/models/review_sessions.py:15-39`

Review sessions group reviews:
```python
class ReviewSession(Base):
    description: Mapped[str]
    notes: Mapped[str]
    scheduled_at: Mapped[date]
    completed_at: Mapped[date]
    reviews: Mapped[list["Review"]]  # via FK
```

This aligns with the proposed design.

---

### 4. Current FSRS Implementation

#### FSRS State Storage (Current)

FSRS state is stored directly on `Topic`:
- `stability`, `difficulty`, `state`, `step`
- `inherited_*` fields for parent-propagated state
- `last_reviewed_at` updated via database trigger on review insert

#### FSRS State Storage (Proposed)

Separate `fsrs_states` table:
```sql
CREATE TABLE fsrs_states (
    id BIGINT PRIMARY KEY,
    stability REAL,
    difficulty REAL,
    state learning_state,
    step INTEGER,
    last_reviewed_at DATE,
    srs_enabled BOOLEAN
);
```

Each entity links via `fsrs_state_id` (1:1 unique relationship).

#### Retrievability Calculation

**Location:** `apps/api/app/utils/retrievability.py:9-33`

Currently implemented:
```python
FSRS_DECAY = -0.1542
FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1

def calculate_retrievability(stability, last_reviewed_at, current_date=None):
    # R = (1 + FACTOR * elapsed_days / stability) ^ DECAY
```

Also includes `calculate_days_until_threshold()` for bucket predictions.

The proposed design documents these same formulas and adds bucket categorization (LATE, ON_TIME, EARLY).

---

### 5. Current API Structure

#### Topic Router

**Location:** `apps/api/app/routers/topics.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/topics/` | GET | List topics with filters |
| `/topics/` | POST | Create topic |
| `/topics/{id}/` | GET | Get topic with relationships |
| `/topics/{id}/` | POST | Update topic (uses POST, not PATCH) |
| `/topics/{id}/` | DELETE | Delete topic |
| `/topics/{id}/parents/` | GET | Get parent topics |
| `/topics/{id}/children/` | GET | Get child topics |
| `/topics/{parent_id}/children/` | POST | Add child |
| `/topics/{child_id}/parents/` | POST | Add parent |
| `/topics/{parent_id}/children/{child_id}/` | DELETE | Remove child |
| `/topics/{child_id}/parents/{parent_id}/` | DELETE | Remove parent |
| `/topics/{id}/related/` | GET | Get related topics |
| `/topics/{from_id}/related/` | POST | Add related topic |
| `/topics/{from_id}/related/{to_id}/` | DELETE | Remove related |
| `/topics/{id}/review-sessions/` | GET | Get reviews for topic |
| `/topics/search/` | GET | Search topics |

**Key differences from proposed API:**
- Uses POST for updates (proposed uses PATCH)
- Has separate `/parents/` and `/children/` endpoints (proposed uses only `/children/`)
- Related only supports topics (proposed supports topics + sources)
- No source or practice relationship endpoints

#### Current Inline Create Pattern

The current API supports inline entity creation:
```python
class TopicChildRelationshipCreate(BaseModel):
    child_id: int | None = None
    child: TopicCreate | None = None  # Inline create
```

The proposed design simplifies to ID-only:
```python
class TopicChildAdd(BaseModel):
    child_id: int  # Always ID, create separately
```

---

### 6. Current Schema Structure

#### Pydantic Schemas

**Location:** `apps/api/app/schemas/topics.py`

| Schema | Purpose |
|--------|---------|
| `TopicBase` | Base fields |
| `TopicRead` | Read with FSRS fields flattened |
| `TopicReadWithRelationships` | Read with parents/children lists |
| `TopicRelatedRead` | Read with relationship direction |
| `TopicCreate` | Create payload |
| `TopicUpdate` | Update payload (partial) |
| `TopicChildRelationshipCreate` | Add child (inline or ID) |
| `TopicParentRelationshipCreate` | Add parent (inline or ID) |
| `TopicOtherRelationshipCreate` | Add related (inline or ID) |

**Key differences from proposed:**
- No `*SummaryRead` with counts (proposed has relationship counts)
- No `*DetailRead` with full relationships (proposed separates summary/detail)
- FSRS fields flattened onto `TopicRead` (proposed uses separate `FsrsStateRead`)
- No `retrievability`, `bucket`, `days_until_threshold` computed fields

---

## Code References

### Models
- Topic model: `apps/api/app/models/topics.py:31-127`
- Closure table: `apps/api/app/models/topics.py:129-161`
- Related relations: `apps/api/app/models/topics.py:163-191`
- Review model: `apps/api/app/models/reviews.py:26-83`
- ReviewSession model: `apps/api/app/models/review_sessions.py:15-39`

### Schemas
- Topic schemas: `apps/api/app/schemas/topics.py`
- Review schemas: `apps/api/app/schemas/reviews.py`
- ReviewSession schemas: `apps/api/app/schemas/review_sessions.py`

### Routers
- Topic router: `apps/api/app/routers/topics.py`
- Review router: `apps/api/app/routers/reviews.py`
- ReviewSession router: `apps/api/app/routers/review_sessions.py`

### Utils
- Retrievability: `apps/api/app/utils/retrievability.py`

### Migrations
- Topics table: `supabase/migrations/20250822153137_remote_schema.sql`
- Closure table: `supabase/migrations/20250907140303_dag.sql`
- Related relations: `supabase/migrations/20251210120000_add_topic_other_relations.sql`
- Reviews refactor: `supabase/migrations/20251218120000_refactor_reviews.sql`
- Last reviewed trigger: `supabase/migrations/20251222120000_remove_due_add_last_reviewed.sql`
- Inherited FSRS fields: `supabase/migrations/20251226000000_rename_and_add_inherited_fields.sql`

---

## Migration Path Summary

### Tables to Create
1. `fsrs_states` - Shared FSRS state storage
2. `sources` - Source materials (recursive parent_id)
3. `practices` - Practice activities
4. `source_topics` - Source covers Topic junction
5. `practice_topics` - Practice assesses Topic junction
6. `practice_sources` - Practice assesses Source junction
7. `source_prerequisites` - Source requires Topic/Source junction
8. `entity_relations` - Unified related table (replaces `topic_other_relations`)
9. `source_reviews`, `practice_reviews` - Review association tables

### Tables to Modify
1. `topics` - Add `parent_id`, remove `inherited_*` FSRS fields, add `fsrs_state_id`
2. `reviews` - Remove `topic_id` (use association tables instead)

### Tables to Delete
1. `topics_closure` - Replaced by simple `parent_id`
2. `topic_other_relations` - Replaced by `entity_relations`

### Data Migration Required
1. Resolve multi-parent topics (pick one parent, move others to related)
2. Migrate FSRS state from topics to `fsrs_states` table
3. Migrate `topic_other_relations` to `entity_relations`
4. Create `topic_reviews` associations for existing reviews

---

## Open Questions

1. **Multi-parent resolution strategy:** How should existing topics with multiple parents be handled during migration?
2. **Review session structure:** Current implementation matches proposal closely. Any changes needed?
3. **Search endpoint:** Current has `/topics/search/` with complex filtering. Proposed has unified `/search`. Migration path?
4. **API versioning:** Should new endpoints be `/api/v2` or replace existing `/api/v1`?

## Resolved Questions

1. **Inherited FSRS fields:** The current implementation has `inherited_*` fields for parent-propagated state. **Decision:** Preserve these fields in the new `fsrs_states` table. They allow child entities to inherit review scheduling from their parent when they don't have their own review history.
