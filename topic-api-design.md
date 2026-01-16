# Topic System API Design

API design implementing the entity model from `topic-design-problem.md` and schema from `topic-schema.md`.

---

## Overview

Three core entity types with typed relationships:
- **Topics** — Units of knowledge, skills, techniques, ideas
- **Practices** — Activities with prompts (exercises, problems, drills)
- **Sources** — Created works or portions thereof (books, chapters, quotes)

### Structural Change: Topics and Sources use Tree Structure

**Previously:** Topics used a graph structure with a closure table (`topics_closure`) allowing multiple parents per topic.

**Now:** Both topics and sources use a simple tree structure with at most one parent. This simplifies:
- Hierarchy traversal (no need for closure table queries)
- UI presentation (single path to root)
- Cycle detection (simpler parent-chain check)

**Migration:** The `topics_closure` table will be deleted. Topics with multiple parents will need manual resolution during migration.

All entities support:
- FSRS-based spaced repetition via shared `fsrs_states` table
- Reviews via association tables (`topic_reviews`, `source_reviews`, `practice_reviews`)

---

## Conventions

| Pattern | Convention |
|---------|------------|
| Base URL | `/api/v1` |
| Auth | `user_id` from session (injected via `UserIdDep`) |
| IDs | `int` (BIGINT) |
| Timestamps | ISO 8601 UTC strings |
| Empty text | `""` default (not null) |
| Soft delete | `archived: bool` flag |
| Pagination | `limit` / `offset` query params |
| Filtering | Query params (e.g., `?archived=false&inboxed=true`) |

---

## Pydantic Schemas

### FSRS State

```python
class FsrsStateBase(BaseModel):
    stability: float | None = None
    difficulty: float | None = None
    state: LearningState = LearningState.LEARNING
    step: int | None = None
    srs_enabled: bool = True

class FsrsStateRead(FsrsStateBase):
    id: int
    last_reviewed_at: date | None = None

class LearningState(str, Enum):
    LEARNING = "LEARNING"
    REVIEW = "REVIEW"
    RELEARNING = "RELEARNING"
```

#### Retrievability Computation

The `retrievability` field in entity read schemas is computed using the FSRS power forgetting curve:

```python
# FSRS constants
FSRS_DECAY = -0.1542
FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1  # ≈ 8.96

def calculate_retrievability(
    stability: float | None,
    last_reviewed_at: date | None,
    current_date: date | None = None,
) -> float | None:
    """
    R = (1 + FACTOR * elapsed_days / stability) ^ DECAY

    Returns None if stability or last_reviewed_at is None.
    Returns 1.0 if reviewed today (0 elapsed days).
    """
    if stability is None or last_reviewed_at is None:
        return None
    if current_date is None:
        current_date = date.today()
    elapsed_days = max(0, (current_date - last_reviewed_at).days)
    if elapsed_days == 0:
        return 1.0
    return (1 + FSRS_FACTOR * elapsed_days / stability) ** FSRS_DECAY
```

#### FSRS State Lifecycle

**Creation:** An `fsrs_state` record is created when:
1. `srs_enabled` is set to `true` on entity creation (POST) or update (PATCH)
2. The first review is completed for an entity (automatically creates state if missing)

**Updates:** FSRS state is updated when a review is completed:
1. Before-state is captured from the entity's current fsrs_state
2. FSRS scheduler calculates new state based on rating
3. After-state is stored on the review and copied to the entity's fsrs_state

**Disabling:** Setting `srs_enabled` to `false` keeps the fsrs_state record but excludes the entity from study queues. The state is preserved for potential re-enabling.

### Related Items (Discriminated Union)

Used for `related_outgoing` and `related_incoming` lists that can contain both topics and sources.

> **Directionality note:** The `entity_relations` table stores unidirectional relations—a relation
> from A→B is distinct from B→A. The API exposes both directions separately:
> - `related_outgoing` — outgoing relations (where this entity is the "from" side)
> - `related_incoming` — incoming relations (where this entity is the "to" side)
>
> The frontend may choose to merge these under a single "Related" label for display.

```python
class RelatedTopicRead(TopicSummaryRead):
    """Topic in a related items list, with type discriminator."""
    entity_type: Literal['topic'] = 'topic'

class RelatedSourceRead(SourceSummaryRead):
    """Source in a related items list, with type discriminator."""
    entity_type: Literal['source'] = 'source'

# Discriminated union for related items
RelatedItemRead = Annotated[
    RelatedTopicRead | RelatedSourceRead,
    Field(discriminator='entity_type')
]
```

### Topics

```python
class TopicBase(BaseModel):
    name: str = ""
    notes: str = ""
    archived: bool = False
    inboxed: bool = False

class TopicRead(TopicBase):
    """Base read schema with core fields."""
    id: int
    parent_id: int | None = None
    fsrs_state_id: int | None = None
    inserted_at: datetime
    updated_at: datetime
    # FSRS state (from joined fsrs_states table)
    stability: float | None = None
    difficulty: float | None = None
    state: LearningState | None = None
    step: int | None = None
    srs_enabled: bool = False
    last_reviewed_at: date | None = None
    retrievability: float | None = None  # computed from stability + last_reviewed_at

class TopicSummaryRead(TopicRead):
    """For list endpoints — includes counts instead of full relationships."""
    children_count: int
    related_count: int    # total of outgoing + incoming relations
    sources_count: int    # sources that cover this topic
    practices_count: int  # practices that assess this topic

class TopicDetailRead(TopicRead):
    """For detail endpoint — includes full relationships."""
    parent: TopicSummaryRead | None = None
    children: list[TopicSummaryRead] = []
    related_outgoing: list[RelatedItemRead] = []  # outgoing: items this topic links to
    related_incoming: list[RelatedItemRead] = []  # incoming: items that link to this topic
    sources: list[SourceSummaryRead] = []     # sources that cover this topic
    practices: list[PracticeSummaryRead] = [] # practices that assess this topic

class TopicCreate(TopicBase):
    parent_id: int | None = None
    srs_enabled: bool = False  # creates fsrs_state if true

# Doesn't extend TopicBase because all fields must be Optional for
# partial updates with exclude_unset=True. If it extended TopicBase, fields
# like `name: str = ""` would always have a value, making it impossible to
# distinguish "set to empty string" from "field not provided."
#
# For nullable fields like parent_id:
# - Field omitted from payload → don't change
# - Field set to explicit `null` in JSON → clear the value
class TopicUpdate(BaseModel):
    name: str | None = None
    notes: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    parent_id: int | None = None  # omit to keep, explicit null to clear
    srs_enabled: bool | None = None  # creates/updates linked fsrs_state
```

### Sources

```python
class SourceBase(BaseModel):
    title: str = ""
    notes: str = ""
    archived: bool = False
    inboxed: bool = False

class SourceRead(SourceBase):
    """Base read schema with core fields."""
    id: int
    parent_id: int | None = None
    fsrs_state_id: int | None = None
    inserted_at: datetime
    updated_at: datetime
    # FSRS state (from joined fsrs_states table)
    stability: float | None = None
    difficulty: float | None = None
    state: LearningState | None = None
    step: int | None = None
    srs_enabled: bool = False
    last_reviewed_at: date | None = None
    retrievability: float | None = None  # computed from stability + last_reviewed_at

class SourceSummaryRead(SourceRead):
    """For list endpoints — includes counts instead of full relationships."""
    children_count: int
    topics_count: int         # topics this source covers
    related_count: int        # total of outgoing + incoming relations
    practices_count: int      # practices from this source
    prerequisites_count: int  # topics this source assumes knowledge of

class SourceDetailRead(SourceRead):
    """For detail endpoint — includes full relationships."""
    parent: SourceSummaryRead | None = None
    children: list[SourceSummaryRead] = []
    topics: list[TopicSummaryRead] = []          # topics this source covers
    prerequisites: list[TopicSummaryRead] = []   # topics this source assumes
    related_outgoing: list[RelatedItemRead] = []   # outgoing: items this source links to
    related_incoming: list[RelatedItemRead] = []  # incoming: items that link to this source
    practices: list[PracticeSummaryRead] = []    # practices from this source

class SourceCreate(SourceBase):
    parent_id: int | None = None
    srs_enabled: bool = False  # creates fsrs_state if true

# Doesn't extend SourceBase because all fields must be Optional for
# partial updates with exclude_unset=True. If it extended SourceBase, fields
# like `title: str = ""` would always have a value, making it impossible to
# distinguish "set to empty string" from "field not provided."
#
# For nullable fields like parent_id:
# - Field omitted from payload → don't change
# - Field set to explicit `null` in JSON → clear the value
class SourceUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    parent_id: int | None = None  # omit to keep, explicit null to clear
    srs_enabled: bool | None = None  # creates/updates linked fsrs_state
```

### Practices

```python
class PracticeBase(BaseModel):
    prompt: str = ""
    answer: str = ""
    archived: bool = False
    inboxed: bool = False

class PracticeRead(PracticeBase):
    """Base read schema with core fields."""
    id: int
    fsrs_state_id: int | None = None
    inserted_at: datetime
    updated_at: datetime
    # FSRS state (from joined fsrs_states table)
    stability: float | None = None
    difficulty: float | None = None
    state: LearningState | None = None
    step: int | None = None
    srs_enabled: bool = False
    last_reviewed_at: date | None = None
    retrievability: float | None = None  # computed from stability + last_reviewed_at

class PracticeSummaryRead(PracticeRead):
    """For list endpoints — includes counts instead of full relationships."""
    topics_count: int   # topics this practice assesses
    sources_count: int  # sources this practice assesses

class PracticeDetailRead(PracticeRead):
    """For detail endpoint — includes full relationships."""
    topics: list[TopicSummaryRead] = []   # topics this practice assesses
    sources: list[SourceSummaryRead] = [] # sources this practice assesses

class PracticeCreate(PracticeBase):
    srs_enabled: bool = False  # creates fsrs_state if true

# Doesn't extend PracticeBase because all fields must be Optional for
# partial updates with exclude_unset=True. If it extended PracticeBase, fields
# like `prompt: str = ""` would always have a value, making it impossible to
# distinguish "set to empty string" from "field not provided."
class PracticeUpdate(BaseModel):
    prompt: str | None = None
    answer: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    srs_enabled: bool | None = None  # creates/updates linked fsrs_state
```

### Relationship Request Bodies

Relationship endpoints accept simple ID-only payloads.

> **Design note:** The existing codebase uses a pattern where relationship endpoints accept
> *either* an existing ID *or* an inline create payload. We're simplifying to ID-only for
> this design because:
> - Simpler schemas (no mutually exclusive validation)
> - Single source of truth for entity creation (`POST /topics`, `POST /sources`, etc.)
> - Clearer error handling (create errors vs. link errors are separate)
> - Easier to document and test
>
> If "create and link" is a common flow, the frontend can chain two requests, or we can
> add dedicated endpoints later. KISS.

```python
# Unified related items (for both Topics and Sources)
class RelatedItemAdd(BaseModel):
    """Add a related topic or source."""
    entity_type: Literal['topic', 'source']
    entity_id: int

# Topics (tree structure — parent managed via PATCH, not separate endpoints)
class TopicChildAdd(BaseModel):
    child_id: int

class TopicSourceAdd(BaseModel):
    source_id: int  # source that covers this topic

class TopicPracticeAdd(BaseModel):
    practice_id: int  # practice that assesses this topic

# Sources (tree structure — parent managed via PATCH, not separate endpoints)
class SourceChildAdd(BaseModel):
    child_id: int

class SourceTopicAdd(BaseModel):
    topic_id: int  # topic this source covers

class SourcePrerequisiteAdd(BaseModel):
    topic_id: int  # topic this source assumes knowledge of

class SourcePracticeAdd(BaseModel):
    practice_id: int  # practice that assesses this source

# Practices
class PracticeTopicAdd(BaseModel):
    topic_id: int

class PracticeSourceAdd(BaseModel):
    source_id: int

# Review Sessions
class SessionReviewAdd(BaseModel):
    review_id: int
```

---

### Reviews

```python
class Rating(str, Enum):
    MISS = "MISS"
    HARD = "HARD"
    GOOD = "GOOD"
    EASY = "EASY"

class ReviewBase(BaseModel):
    scheduled_at: date | None = None
    completed_at: date | None = None
    rating: Rating | None = None
    description: str = ""
    notes: str = ""

class ReviewRead(ReviewBase):
    id: int
    review_session_id: int | None = None
    # FSRS snapshots
    stability_before: float | None = None
    difficulty_before: float | None = None
    state_before: LearningState | None = None
    step_before: int | None = None
    stability_after: float | None = None
    difficulty_after: float | None = None
    state_after: LearningState | None = None
    step_after: int | None = None
    inserted_at: datetime
    updated_at: datetime

class TopicReviewRead(ReviewRead):
    """Review associated with a topic."""
    entity_type: Literal['topic'] = 'topic'
    topic: TopicSummaryRead

class SourceReviewRead(ReviewRead):
    """Review associated with a source."""
    entity_type: Literal['source'] = 'source'
    source: SourceSummaryRead

class PracticeReviewRead(ReviewRead):
    """Review associated with a practice."""
    entity_type: Literal['practice'] = 'practice'
    practice: PracticeSummaryRead

# Discriminated union for review details
ReviewDetailRead = Annotated[
    TopicReviewRead | SourceReviewRead | PracticeReviewRead,
    Field(discriminator='entity_type')
]

# Create schemas enforce exactly one entity association
class TopicReviewCreate(ReviewBase):
    topic_id: int

class SourceReviewCreate(ReviewBase):
    source_id: int

class PracticeReviewCreate(ReviewBase):
    practice_id: int

class ReviewUpdate(BaseModel):
    scheduled_at: date | None = None
    completed_at: date | None = None
    rating: Rating | None = None
    description: str | None = None
    notes: str | None = None
```

### Review Sessions

```python
class ReviewSessionBase(BaseModel):
    description: str = ""
    notes: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None

class ReviewSessionRead(ReviewSessionBase):
    id: int
    reviews_count: int
    inserted_at: datetime
    updated_at: datetime

class ReviewSessionDetailRead(ReviewSessionRead):
    reviews: list[ReviewDetailRead] = []

class ReviewSessionCreate(ReviewSessionBase):
    pass  # don't need anything more than ReviewSessionBase

class ReviewSessionUpdate(BaseModel):
    description: str | None = None
    notes: str | None = None
    scheduled_at: date | None = None
    completed_at: date | None = None
```

---

## Endpoints

### Topics

#### CRUD Operations

**`GET /topics`** — List topics

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `archived` | query | `bool` | No | Filter by archived status |
| `inboxed` | query | `bool` | No | Filter by inbox status |
| `root` | query | `bool` | No | Only root topics (no parent) |
| `scheduled` | query | `bool` | No | Only topics with scheduled reviews |
| `srs_enabled` | query | `bool` | No | Filter by SRS status |
| `limit` | query | `int` | No | Max results (default 100) |
| `offset` | query | `int` | No | Skip results (default 0) |

→ Response: `list[TopicSummaryRead]`

---

**`POST /topics`** — Create topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `name` | body | `str` | No | Topic name (default `""`) |
| `notes` | body | `str` | No | Topic notes (default `""`) |
| `archived` | body | `bool` | No | Archived status (default `false`) |
| `inboxed` | body | `bool` | No | Inbox status (default `false`) |
| `parent_id` | body | `int` | No | Parent topic ID |
| `srs_enabled` | body | `bool` | No | Enable SRS (default `false`, creates fsrs_state if true) |

→ Response: `TopicSummaryRead`

---

**`GET /topics/{id}`** — Get topic with full relationships

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |

→ Response: `TopicDetailRead`

---

**`PATCH /topics/{id}`** — Update topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |
| `name` | body | `str` | No | Topic name |
| `notes` | body | `str` | No | Topic notes |
| `archived` | body | `bool` | No | Archived status |
| `inboxed` | body | `bool` | No | Inbox status |
| `parent_id` | body | `int \| null` | No | Parent topic ID (null to remove) |
| `srs_enabled` | body | `bool` | No | Enable/disable SRS (creates fsrs_state if needed) |

→ Response: `TopicSummaryRead`

---

**`DELETE /topics/{id}`** — Delete topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |
| `handle_children_by` | query | `str` | Conditional | Required if topic has children: `delete`, `orphan`, `reparent` |

**Child handling options:**
- `delete` — Recursively delete all child topics
- `orphan` — Set children's `parent_id` to `null` (make them root topics)
- `reparent` — Set children's `parent_id` to the deleted topic's parent (attach to grandparent)

→ Response: `204 No Content`
→ Error: `409 Conflict` if topic has children and `handle_children_by` param not specified
→ Error: `400 Bad Request` if invalid `handle_children_by` value

---

#### Relationship Operations

> **Note:** Topics use a tree structure with at most one parent. Parent is managed via
> `PATCH /topics/{id}` with `parent_id` field (set to `null` to remove parent).
> The child/related endpoints below are for managing the inverse direction.

**`POST /topics/{id}/children`** — Add child topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Parent topic ID |
| — | body | `TopicChildAdd` | Yes | Child topic ID |

→ Response: `TopicSummaryRead` (the parent topic)
→ Error: `409 Conflict` if would create cycle or already exists

---

**`DELETE /topics/{id}/children/{child_id}`** — Remove child topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Parent topic ID |
| `child_id` | path | `int` | Yes | Child topic ID |

→ Response: `204 No Content`

---

**`POST /topics/{id}/related`** — Add related item (topic or source)

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |
| `entity_type` | body | `'topic' \| 'source'` | Yes | Type of related entity |
| `entity_id` | body | `int` | Yes | ID of related entity |

→ Response: `TopicSummaryRead`
→ Error: `409 Conflict` if relation already exists

---

**`DELETE /topics/{id}/related/{entity_type}/{entity_id}`** — Remove related item

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |
| `entity_type` | path | `'topic' \| 'source'` | Yes | Type of related entity |
| `entity_id` | path | `int` | Yes | ID of related entity |

→ Response: `204 No Content`

---

**`POST /topics/{id}/sources`** — Add source that covers this topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |
| — | body | `TopicSourceAdd` | Yes | Source ID |

→ Response: `TopicSummaryRead`
→ Error: `409 Conflict` if relation already exists

---

**`DELETE /topics/{id}/sources/{source_id}`** — Remove source from topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |
| `source_id` | path | `int` | Yes | Source ID to remove |

→ Response: `204 No Content`

---

**`POST /topics/{id}/practices`** — Add practice that assesses this topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |
| — | body | `TopicPracticeAdd` | Yes | Practice ID |

→ Response: `TopicSummaryRead`
→ Error: `409 Conflict` if relation already exists

---

**`DELETE /topics/{id}/practices/{practice_id}`** — Remove practice from topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |
| `practice_id` | path | `int` | Yes | Practice ID to remove |

→ Response: `204 No Content`

---

#### Review Operations

**`GET /topics/{id}/reviews`** — List reviews for topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Topic ID |
| `completed` | query | `bool` | No | Filter by completion status |
| `limit` | query | `int` | No | Max results (default 100) |
| `offset` | query | `int` | No | Skip results (default 0) |

→ Response: `list[ReviewRead]`

---

### Sources

#### CRUD Operations

**`GET /sources`** — List sources

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `archived` | query | `bool` | No | Filter by archived status |
| `inboxed` | query | `bool` | No | Filter by inbox status |
| `root` | query | `bool` | No | Only root sources (no parent) |
| `scheduled` | query | `bool` | No | Only sources with scheduled reviews |
| `srs_enabled` | query | `bool` | No | Filter by SRS status |
| `limit` | query | `int` | No | Max results (default 100) |
| `offset` | query | `int` | No | Skip results (default 0) |

→ Response: `list[SourceSummaryRead]`

---

**`POST /sources`** — Create source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `title` | body | `str` | No | Source title (default `""`) |
| `notes` | body | `str` | No | Source notes (default `""`) |
| `archived` | body | `bool` | No | Archived status (default `false`) |
| `inboxed` | body | `bool` | No | Inbox status (default `false`) |
| `parent_id` | body | `int` | No | Parent source ID |
| `srs_enabled` | body | `bool` | No | Enable SRS (default `false`, creates fsrs_state if true) |

→ Response: `SourceSummaryRead`

---

**`GET /sources/{id}`** — Get source with full relationships

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |

→ Response: `SourceDetailRead`

---

**`PATCH /sources/{id}`** — Update source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| `title` | body | `str` | No | Source title |
| `notes` | body | `str` | No | Source notes |
| `archived` | body | `bool` | No | Archived status |
| `inboxed` | body | `bool` | No | Inbox status |
| `parent_id` | body | `int \| null` | No | Parent source ID (null to remove) |
| `srs_enabled` | body | `bool` | No | Enable/disable SRS (creates fsrs_state if needed) |

→ Response: `SourceSummaryRead`

---

**`DELETE /sources/{id}`** — Delete source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| `handle_children_by` | query | `str` | Conditional | Required if source has children: `delete`, `orphan`, `reparent` |

**Child handling options:**
- `delete` — Recursively delete all child sources
- `orphan` — Set children's `parent_id` to `null` (make them root sources)
- `reparent` — Set children's `parent_id` to the deleted source's parent (attach to grandparent)

→ Response: `204 No Content`
→ Error: `409 Conflict` if source has children and `handle_children_by` param not specified
→ Error: `400 Bad Request` if invalid `handle_children_by` value

---

#### Relationship Operations

> **Note:** Sources use a tree structure with at most one parent. Parent is managed via
> `PATCH /sources/{id}` with `parent_id` field (set to `null` to remove parent).
> The child/covers/related endpoints below are for managing other relationships.

**`POST /sources/{id}/children`** — Add child source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Parent source ID |
| — | body | `SourceChildAdd` | Yes | Child source ID |

→ Response: `SourceSummaryRead` (the parent source)
→ Error: `409 Conflict` if would create cycle or already exists

---

**`DELETE /sources/{id}/children/{child_id}`** — Remove child source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Parent source ID |
| `child_id` | path | `int` | Yes | Child source ID |

→ Response: `204 No Content`

---

**`POST /sources/{id}/topics`** — Add covered topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| — | body | `SourceTopicAdd` | Yes | Topic ID |

→ Response: `SourceSummaryRead`
→ Error: `409 Conflict` if relation already exists

---

**`DELETE /sources/{id}/topics/{topic_id}`** — Remove covered topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| `topic_id` | path | `int` | Yes | Topic ID to remove |

→ Response: `204 No Content`

---

**`POST /sources/{id}/related`** — Add related item (topic or source)

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| `entity_type` | body | `'topic' \| 'source'` | Yes | Type of related entity |
| `entity_id` | body | `int` | Yes | ID of related entity |

→ Response: `SourceSummaryRead`
→ Error: `409 Conflict` if relation already exists

---

**`DELETE /sources/{id}/related/{entity_type}/{entity_id}`** — Remove related item

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| `entity_type` | path | `'topic' \| 'source'` | Yes | Type of related entity |
| `entity_id` | path | `int` | Yes | ID of related entity |

→ Response: `204 No Content`

---

**`POST /sources/{id}/prerequisites`** — Add prerequisite topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| — | body | `SourcePrerequisiteAdd` | Yes | Topic ID |

→ Response: `SourceSummaryRead`
→ Error: `409 Conflict` if relation already exists

---

**`DELETE /sources/{id}/prerequisites/{topic_id}`** — Remove prerequisite topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| `topic_id` | path | `int` | Yes | Topic ID to remove |

→ Response: `204 No Content`

---

**`POST /sources/{id}/practices`** — Add practice that assesses this source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| — | body | `SourcePracticeAdd` | Yes | Practice ID |

→ Response: `SourceSummaryRead`
→ Error: `409 Conflict` if relation already exists

---

**`DELETE /sources/{id}/practices/{practice_id}`** — Remove practice from source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| `practice_id` | path | `int` | Yes | Practice ID to remove |

→ Response: `204 No Content`

---

#### Review Operations

**`GET /sources/{id}/reviews`** — List reviews for source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Source ID |
| `completed` | query | `bool` | No | Filter by completion status |
| `limit` | query | `int` | No | Max results (default 100) |
| `offset` | query | `int` | No | Skip results (default 0) |

→ Response: `list[ReviewRead]`

---

### Practices

#### CRUD Operations

**`GET /practices`** — List practices

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `archived` | query | `bool` | No | Filter by archived status |
| `inboxed` | query | `bool` | No | Filter by inbox status |
| `source_id` | query | `int` | No | Filter by source |
| `topic_id` | query | `int` | No | Filter by tested topic |
| `scheduled` | query | `bool` | No | Only practices with scheduled reviews |
| `srs_enabled` | query | `bool` | No | Filter by SRS status |
| `limit` | query | `int` | No | Max results (default 100) |
| `offset` | query | `int` | No | Skip results (default 0) |

→ Response: `list[PracticeSummaryRead]`

---

**`POST /practices`** — Create practice

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `prompt` | body | `str` | No | Practice prompt (default `""`) |
| `answer` | body | `str` | No | Practice answer (default `""`) |
| `archived` | body | `bool` | No | Archived status (default `false`) |
| `inboxed` | body | `bool` | No | Inbox status (default `false`) |
| `srs_enabled` | body | `bool` | No | Enable SRS (default `false`, creates fsrs_state if true) |

→ Response: `PracticeSummaryRead`

---

**`GET /practices/{id}`** — Get practice with full relationships

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Practice ID |

→ Response: `PracticeDetailRead`

---

**`PATCH /practices/{id}`** — Update practice

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Practice ID |
| `prompt` | body | `str` | No | Practice prompt |
| `answer` | body | `str` | No | Practice answer |
| `archived` | body | `bool` | No | Archived status |
| `inboxed` | body | `bool` | No | Inbox status |
| `srs_enabled` | body | `bool` | No | Enable/disable SRS (creates fsrs_state if needed) |

→ Response: `PracticeSummaryRead`

---

**`DELETE /practices/{id}`** — Delete practice

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Practice ID |

→ Response: `204 No Content`

---

#### Relationship Operations

**`POST /practices/{id}/topics`** — Add assessed topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Practice ID |
| — | body | `PracticeTopicAdd` | Yes | Topic ID |

→ Response: `PracticeSummaryRead`
→ Error: `409 Conflict` if relation already exists

---

**`DELETE /practices/{id}/topics/{topic_id}`** — Remove assessed topic

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Practice ID |
| `topic_id` | path | `int` | Yes | Topic ID to remove |

→ Response: `204 No Content`

---

**`POST /practices/{id}/sources`** — Add assessed source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Practice ID |
| — | body | `PracticeSourceAdd` | Yes | Source ID |

→ Response: `PracticeSummaryRead`
→ Error: `409 Conflict` if relation already exists

---

**`DELETE /practices/{id}/sources/{source_id}`** — Remove assessed source

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Practice ID |
| `source_id` | path | `int` | Yes | Source ID to remove |

→ Response: `204 No Content`

---

#### Review Operations

**`GET /practices/{id}/reviews`** — List reviews for practice

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Practice ID |
| `completed` | query | `bool` | No | Filter by completion status |
| `limit` | query | `int` | No | Max results (default 100) |
| `offset` | query | `int` | No | Skip results (default 0) |

→ Response: `list[ReviewRead]`

---

### Reviews

Reviews are polymorphic—each review is associated with exactly one entity type via association tables.

#### CRUD Operations

**`GET /reviews`** — List all reviews

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `entity_type` | query | `str` | No | Filter by type: `topic`, `source`, `practice` |
| `entity_id` | query | `int` | No | Filter by specific entity |
| `session_id` | query | `int` | No | Filter by review session |
| `completed` | query | `bool` | No | Filter by completion status |
| `scheduled_before` | query | `date` | No | Reviews scheduled before date |
| `scheduled_after` | query | `date` | No | Reviews scheduled after date |
| `limit` | query | `int` | No | Max results (default 100) |
| `offset` | query | `int` | No | Skip results (default 0) |

→ Response: `list[ReviewRead]`

---

**`POST /reviews/topic`** — Create topic review

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `topic_id` | body | `int` | Yes | Topic ID |
| `scheduled_at` | body | `date` | No | Scheduled review date |
| `completed_at` | body | `date` | No | Completion date |
| `rating` | body | `Rating` | No | Rating: `MISS`, `HARD`, `GOOD`, `EASY` |
| `description` | body | `str` | No | Review description (default `""`) |
| `notes` | body | `str` | No | Review notes (default `""`) |

→ Response: `ReviewRead`

---

**`POST /reviews/source`** — Create source review

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `source_id` | body | `int` | Yes | Source ID |
| `scheduled_at` | body | `date` | No | Scheduled review date |
| `completed_at` | body | `date` | No | Completion date |
| `rating` | body | `Rating` | No | Rating: `MISS`, `HARD`, `GOOD`, `EASY` |
| `description` | body | `str` | No | Review description (default `""`) |
| `notes` | body | `str` | No | Review notes (default `""`) |

→ Response: `ReviewRead`

---

**`POST /reviews/practice`** — Create practice review

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `practice_id` | body | `int` | Yes | Practice ID |
| `scheduled_at` | body | `date` | No | Scheduled review date |
| `completed_at` | body | `date` | No | Completion date |
| `rating` | body | `Rating` | No | Rating: `MISS`, `HARD`, `GOOD`, `EASY` |
| `description` | body | `str` | No | Review description (default `""`) |
| `notes` | body | `str` | No | Review notes (default `""`) |

→ Response: `ReviewRead`

---

**`GET /reviews/{id}`** — Get review with entity

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Review ID |

→ Response: `ReviewDetailRead`

---

**`PATCH /reviews/{id}`** — Update review

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Review ID |
| `scheduled_at` | body | `date` | No | Scheduled review date |
| `completed_at` | body | `date` | No | Completion date |
| `rating` | body | `Rating` | No | Rating: `MISS`, `HARD`, `GOOD`, `EASY` |
| `description` | body | `str` | No | Review description |
| `notes` | body | `str` | No | Review notes |

**Side effects:** When `rating` is provided, the FSRS scheduler calculates new state values. The review's `*_before` fields are populated from the entity's current fsrs_state, the `*_after` fields contain the computed new state, and the entity's fsrs_state is updated to match the after values.

→ Response: `ReviewRead`

---

**`DELETE /reviews/{id}`** — Delete review

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Review ID |

→ Response: `204 No Content`

---

#### Example Flows

**Create Review Flow:**

```
POST /reviews/topic
{
  "topic_id": 123,
  "scheduled_at": "2025-01-15"
}

Response:
{
  "id": 456,
  ...
}
```

**Complete Review Flow:**

```
PATCH /reviews/456
{
  "completed_at": "2025-01-15",
  "rating": "GOOD"
}

Response:
{
  "id": 456,
  "rating": "GOOD",
  "stability_before": 1.0,
  "stability_after": 2.5
  ...
}
```

---

### Review Sessions

#### CRUD Operations

**`GET /review-sessions`** — List sessions

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `completed` | query | `bool` | No | Filter by completion status |
| `scheduled_before` | query | `date` | No | Sessions scheduled before date |
| `scheduled_after` | query | `date` | No | Sessions scheduled after date |
| `limit` | query | `int` | No | Max results (default 100) |
| `offset` | query | `int` | No | Skip results (default 0) |

→ Response: `list[ReviewSessionRead]`

---

**`POST /review-sessions`** — Create session

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `description` | body | `str` | No | Session description (default `""`) |
| `notes` | body | `str` | No | Session notes (default `""`) |
| `scheduled_at` | body | `date` | No | Scheduled date |
| `completed_at` | body | `date` | No | Completion date |

→ Response: `ReviewSessionRead`

---

**`GET /review-sessions/{id}`** — Get session with reviews

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Session ID |

→ Response: `ReviewSessionDetailRead`

---

**`PATCH /review-sessions/{id}`** — Update session

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Session ID |
| `description` | body | `str` | No | Session description |
| `notes` | body | `str` | No | Session notes |
| `scheduled_at` | body | `date` | No | Scheduled date |
| `completed_at` | body | `date` | No | Completion date |

→ Response: `ReviewSessionRead`

---

**`DELETE /review-sessions/{id}`** — Delete session

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Session ID |

→ Response: `204 No Content`

---

#### Review Association Operations

**`POST /review-sessions/{id}/reviews`** — Add review to session

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Session ID |
| — | body | `SessionReviewAdd` | Yes | Review ID |

→ Response: `ReviewSessionRead`
→ Error: `409 Conflict` if review already in session

---

**`DELETE /review-sessions/{id}/reviews/{review_id}`** — Remove review from session

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | path | `int` | Yes | Session ID |
| `review_id` | path | `int` | Yes | Review ID to remove |

→ Response: `204 No Content`

---

### Search

Unified search endpoint for finding topics, sources, and practices.

**`GET /search`** — Search across all entity types

| Input | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `q` | query | `str` | Yes | Search query |
| `types` | query | `list[str]` | No | Entity types to search: `topic`, `source`, `practice` (default: all) |
| `archived` | query | `bool` | No | Include archived items (default `false`) |
| `limit` | query | `int` | No | Max results per type (default 20) |

→ Response: `SearchResponse`

```python
class SearchResponse(BaseModel):
    topics: list[TopicSummaryRead]
    sources: list[SourceSummaryRead]
    practices: list[PracticeSummaryRead]
    total_count: int
```

**Search behavior:**
- Searches `name` and `notes` fields for topics
- Searches `title` and `notes` fields for sources
- Searches `prompt` and `answer` fields for practices
- Case-insensitive partial matching
- Results ordered by relevance (exact matches first, then prefix matches, then contains)

---

## Router Structure

```
app/routers/
├── topics.py           # Topic CRUD + relationships
├── sources.py          # Source CRUD + relationships
├── practices.py        # Practice CRUD + relationships
├── reviews.py          # Polymorphic review CRUD
├── review_sessions.py  # Session management
├── search.py           # Unified search endpoint
└── login.py            # Authentication
```

---

## Models Structure

> **Note:** Both topics and sources use a simple `parent_id` foreign key for tree structure.
> The `topics_closure` table from the current schema is deleted.

```
app/models/
├── base.py             # SQLAlchemy base, common mixins
├── fsrs_state.py       # FsrsState model
├── topic.py            # Topic model (parent_id for tree hierarchy)
├── source.py           # Source model (parent_id for tree hierarchy)
├── practice.py         # Practice model
├── review.py           # Review model
├── review_session.py   # ReviewSession model
└── associations.py     # Junction tables:
                        #   - entity_relations (unified related_to for topics/sources)
                        #   - source_topics
                        #   - source_prerequisites
                        #   - practice_topics
                        #   - practice_sources
                        #   - topic_reviews
                        #   - source_reviews
                        #   - practice_reviews
```

---

## Schemas Structure

```
app/schemas/
├── fsrs_state.py       # FsrsStateBase, FsrsStateRead, LearningState
├── related.py          # RelatedTopicRead, RelatedSourceRead, RelatedItemRead,
│                       # RelatedItemAdd
├── topic.py            # TopicBase, TopicRead, TopicSummaryRead, TopicDetailRead,
│                       # TopicCreate, TopicUpdate, TopicChildAdd, TopicSourceAdd, TopicPracticeAdd
├── source.py           # SourceBase, SourceRead, SourceSummaryRead, SourceDetailRead,
│                       # SourceCreate, SourceUpdate,
│                       # SourceChildAdd, SourceTopicAdd, SourcePrerequisiteAdd, SourcePracticeAdd
├── practice.py         # PracticeBase, PracticeRead, PracticeSummaryRead, PracticeDetailRead,
│                       # PracticeCreate, PracticeUpdate,
│                       # PracticeTopicAdd, PracticeSourceAdd
├── review.py           # ReviewBase, ReviewRead,
│                       # TopicReviewRead, SourceReviewRead, PracticeReviewRead, ReviewDetailRead,
│                       # TopicReviewCreate, SourceReviewCreate, PracticeReviewCreate,
│                       # ReviewUpdate, Rating
├── review_session.py   # ReviewSessionBase, ReviewSessionRead, ReviewSessionDetailRead,
│                       # ReviewSessionCreate, ReviewSessionUpdate, SessionReviewAdd
└── search.py           # SearchResponse
```

**Schema naming convention:**
- `*Read` — Base read schema with core fields and computed FSRS state
- `*SummaryRead` — For list endpoints; extends `*Read` with relationship counts
- `*DetailRead` — For detail endpoints; extends `*Read` with full relationships

---

## Example Flows

### Creating a Source with Nested Structure

```
# Create book
POST /sources
{ "title": "The Swift Programming Language" }
→ { "id": 1, "title": "The Swift Programming Language", ... }

# Create chapter under book
POST /sources
{ "title": "Strings and Characters", "parent_id": 1 }
→ { "id": 2, "title": "Strings and Characters", "parent_id": 1, ... }

# Link chapter to topic
POST /sources/2/topics
{ "topic_id": 10 }
```

### Creating a Practice for a Source

```
# Create practice
POST /practices
{
  "prompt": "What is the difference between String and Character in Swift?",
  "answer": "String is a collection of Characters..."
}
→ { "id": 5, ... }

# Link practice to source(s) it assesses
POST /practices/5/sources
{ "source_id": 2 }

# Link practice to topic(s) it assesses
POST /practices/5/topics
{ "topic_id": 10 }
```

### Adding Related Items (Unified Bucket)

```
# Topic can be related to another topic
POST /topics/10/related
{ "entity_type": "topic", "entity_id": 20 }

# Topic can also be related to a source (loose association, not "covers")
POST /topics/10/related
{ "entity_type": "source", "entity_id": 5 }

# Source can be related to a topic
POST /sources/5/related
{ "entity_type": "topic", "entity_id": 30 }

# Source can be related to another source
POST /sources/5/related
{ "entity_type": "source", "entity_id": 6 }

# Get topic — related items split by direction
GET /topics/10
→ {
    "id": 10,
    "name": "Japanese Woodworking",
    "related_outgoing": [
      { "entity_type": "topic", "id": 20, "name": "Minimalism", ... },
      { "entity_type": "source", "id": 5, "title": "Wabi-Sabi for Artists", ... }
    ],
    "related_incoming": [],
    ...
  }
```

### Adding a Source with Prerequisites

```
# Create the source (an advanced article)
POST /sources
{ "title": "TanStack Query: Performance & Request Waterfalls" }
→ { "id": 10, "title": "TanStack Query: Performance & Request Waterfalls", ... }

# Link to topic it covers
POST /sources/10/topics
{ "topic_id": 50 }  # "Request Waterfalls" topic

# Mark prerequisite topics this source assumes
POST /sources/10/prerequisites
{ "topic_id": 20 }  # "React Query Basics"

POST /sources/10/prerequisites
{ "topic_id": 21 }  # "React Component Lifecycle"

# Get source with all relationships
GET /sources/10
→ {
    "id": 10,
    "title": "TanStack Query: Performance & Request Waterfalls",
    "topics": [{ "id": 50, "name": "Request Waterfalls", ... }],
    "prerequisites": [
      { "id": 20, "name": "React Query Basics", ... },
      { "id": 21, "name": "React Component Lifecycle", ... }
    ],
    "related_outgoing": [],  # outgoing: items this source links to
    "related_incoming": [],  # incoming: items that link to this source
    ...
  }
```

### Reviewing Items

```
# Create review for a practice
POST /reviews/practice
{
  "practice_id": 5,
  "scheduled_at": "2025-01-14"
}
→ { "id": 100, ... }

# Complete the review
PATCH /reviews/100
{
  "completed_at": "2025-01-14",
  "rating": "GOOD"
}
→ {
    "id": 100,
    "rating": "GOOD",
    "stability_before": 1.0,
    "stability_after": 2.8,
    ...
  }
```

---

## Error Responses

Standard HTTP status codes with JSON error bodies:

```python
class ErrorResponse(BaseModel):
    detail: str

# 400 Bad Request - Invalid input
# 401 Unauthorized - Missing/invalid auth
# 403 Forbidden - Not owner of resource
# 404 Not Found - Resource doesn't exist
# 409 Conflict - Would create cycle, duplicate relation
# 422 Unprocessable Entity - Validation error
```

**Cycle Prevention:**

When setting `parent_id` on topics or sources, the API checks for cycles:

```
PATCH /topics/5
{ "parent_id": 10 }

# If topic 10 is a descendant of topic 5:
→ 409 Conflict
{ "detail": "Cannot set parent: would create cycle" }
```

---

## Migration Notes

### From Current Schema

The current system has a single `topics` table with overloaded relationships and a graph structure. Migration strategy:

1. **Topics remain topics** — Conceptual knowledge items stay in `topics`
2. **Create sources** — For items that are source materials (books, chapters)
3. **Create practices** — For items that are exercises/problems
4. **Migrate relationships:**
   - `parent/child` on conceptual topics → `subtopic_of` (keep as parent_id)
   - `parent/child` for source materials → New `sources` table with `parent_id`
   - `related` between topics → `topic_relations`
5. **Review history** — Migrate existing reviews to appropriate `*_reviews` tables

### Topic Graph → Tree Migration

The current `topics` table uses a closure table (`topics_closure`) for graph-based parent/child relationships. This is being simplified to a tree structure:

1. **Delete `topics_closure` table** — No longer needed with single-parent tree structure
2. **Resolve multi-parent topics** — Topics with multiple parents need manual resolution:
   - Option A: Pick one parent, move others to `related_to`
   - Option B: Duplicate the topic under each parent
   - Option C: User-guided resolution during migration
3. **Add `parent_id` column** — Direct foreign key to parent topic (nullable)
