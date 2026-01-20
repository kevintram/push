# Topic System Design

## Problem

The current topic system has two relationship types—parent/child and related—but there's no clear decision rule for when to use which.

**Root cause:** Everything is modeled as a "topic," but topics actually represent different things:
- **Concepts** (e.g., "integration by parts")
- **Practices** (e.g., "solve ∫x·eˣ dx")
- **Source materials** (e.g., "Swift Book, Chapter: Strings")

The parent/child relationship is overloaded to express conceptual containment, practice-to-topic links, and chapter-to-topic links. One relationship type can't cleanly express all of these.

**Solution:** Separate entity types. Topics, Practices, and Sources are different entities with distinct relationships.

**Why Prerequisites?** Sources often assume prior knowledge. An advanced article on "React Query Performance" assumes you already understand React hooks and basic React Query usage. Prerequisites can be either Topics (conceptual knowledge) or other Sources (prior material to complete). Tracking prerequisites lets users:
- See what they should learn before tackling a source
- Get warnings when reviewing sources with unlearned prerequisites
- Build a proper learning sequence through their materials

---

## Design

### Core Principle

Distinct entity types for distinct kinds of things. Relationships are typed and explicit. Review/SRS is an orthogonal layer that can attach to any entity.

### Entities (3)

| Entity | Purpose |
|--------|---------|
| **Topic** | A unit of knowledge, skill, technique, named thing, or idea |
| **Practice** | An activity with a prompt—exercises, problems, drills |
| **Source** | Any created work or portion thereof—books, chapters, songs, verses, codebases, components, quotes |

### Entity Details

#### Topic

The fundamental unit of learning. What you're actually trying to learn about.

| Property | Description |
|----------|-------------|
| `name` | The topic's name |
| `notes` | Optional personal annotations |
| `archived` | Whether the topic is archived |
| `inboxed` | Whether the topic is in the inbox |

| Relationship | Target | Description |
|--------------|--------|-------------|
| `parent` | Topic | Hierarchy ("integration by parts" → "integration techniques") |
| `related_outgoing` | Topic(s) or Source(s) | Outgoing relations: items this topic links to |
| `related_incoming` | Topic(s) or Source(s) | Incoming relations: items that link to this topic |

#### Practice

Something you *do* to learn or test understanding.

| Property | Description |
|----------|-------------|
| `prompt` | The question or task |
| `answer` | The solution/response |
| `archived` | Whether the practice is archived |
| `inboxed` | Whether the practice is in the inbox |

| Relationship | Target | Description |
|--------------|--------|-------------|
| `assesses` | Topic(s) | What topic(s) this practice assesses |
| `assesses` | Source(s) | What source(s) this practice assesses |

#### Source

Any created work or portion thereof—books, chapters, songs, verses, codebases, components, quotes. Sources can nest recursively (a book contains chapters, a chapter contains sections, etc.).

| Property | Description |
|----------|-------------|
| `title` | Name of the source |
| `notes` | Optional personal annotations |
| `archived` | Whether the source is archived |
| `inboxed` | Whether the source is in the inbox |

| Relationship | Target | Description |
|--------------|--------|-------------|
| `parent` | Source | What it belongs to (for nested sources) |
| `topics` | Topic(s) | What topics this Source covers |
| `prerequisites` | Topic(s) or Source(s) | Topics or sources this source assumes knowledge of / completion of |
| `related_outgoing` | Topic(s) or Source(s) | Outgoing relations: items this source links to |
| `related_incoming` | Topic(s) or Source(s) | Incoming relations: items that link to this source |

### Review Layer (Orthogonal)

Any entity can be reviewable. The review system has two parts:

#### FSRS State (shared table)

Each entity links to a shared `fsrs_states` table via `fsrs_state_id`:

| Property | Description |
|----------|-------------|
| `stability` | Memory stability (higher = longer retention) |
| `difficulty` | Item difficulty (0-10) |
| `state` | Learning state: `LEARNING`, `REVIEW`, or `RELEARNING` |
| `step` | Current step in learning/relearning phase |
| `last_reviewed_at` | Date of last review |
| `srs_enabled` | Whether SRS scheduling is enabled |

#### Review Events (shared table + associations)

Each review is logged with before/after FSRS snapshots:

| Property | Description |
|----------|-------------|
| `scheduled_at` | When the review was scheduled |
| `completed_at` | When the review was completed |
| `rating` | User rating: `miss`, `hard`, `good`, `easy` |
| `*_before` | FSRS state snapshot before review |
| `*_after` | FSRS state snapshot after review |

Reviews link to entities via association tables (`topic_reviews`, `source_reviews`, `practice_reviews`) and can be grouped into `review_sessions`.

**What review looks like per entity:**

| Entity | Review experience |
|--------|-------------------|
| **Topic** | "Explain X" — test your understanding |
| **Practice** | Do the exercise, solve the problem |
| **Source** | "Review this chapter's key ideas" |

---

## Entity Relationships Overview

Each entity's relationships from its own perspective:

### Topic
| Relationship | Description |
|--------------|-------------|
| **Children** | Child topics in the hierarchy |
| **Practices** | Practices that assess this topic |
| **Sources** | Sources that cover this topic |
| **Related outgoing** | Outgoing: topics and sources this topic links to |
| **Related incoming** | Incoming: topics and sources that link to this topic |

### Source
| Relationship | Description |
|--------------|-------------|
| **Children** | Child sources (chapters, sections, quotes) |
| **Topics** | Topics this source covers |
| **Practices** | Practices that assess this source |
| **Prerequisites** | Topics or sources this source assumes knowledge of / completion of |
| **Related outgoing** | Outgoing: topics and sources this source links to |
| **Related incoming** | Incoming: topics and sources that link to this source |

### Practice
| Relationship | Description |
|--------------|-------------|
| **Topics** | Topics this practice assesses |
| **Sources** | Sources this practice assesses |

---

## Relationship Implementation

```
Topic
  ├── children ←── Topic.parent_id (inverse)
  ├── practices ←── practice_topics (inverse)
  ├── sources ←── source_topics (inverse)
  ├── related_outgoing → entity_relations (where from_topic_id = this)
  ├── related_incoming ←── entity_relations (where to_topic_id = this)
  └── fsrs_state_id → fsrs_states

Source
  ├── children ←── Source.parent_id (inverse)
  ├── topics → source_topics
  ├── practices ←── practice_sources (inverse)
  ├── prerequisites → source_prerequisites (topic_id OR source_id)
  ├── related_outgoing → entity_relations (where from_source_id = this)
  ├── related_incoming ←── entity_relations (where to_source_id = this)
  └── fsrs_state_id → fsrs_states

Practice
  ├── topics → practice_topics
  ├── sources → practice_sources
  └── fsrs_state_id → fsrs_states

Review
  ├── reviews (shared data)
  │     └── review_sessions (grouping)
  └── associations
        ├── topic_reviews
        ├── source_reviews
        └── practice_reviews
```
---

## Design Principles

1. **Distinct things are distinct entities.** Topics, Practices, and Sources serve different purposes.
2. **Relationships are typed and explicit.** No overloaded "parent/child."
3. **Review is orthogonal.** Any entity can be reviewable.
4. **Sources are recursive.** Books, chapters, quotes—anything at any level of granularity.
5. **Notes are properties, not entities.** Personal annotations attach via a `notes` field.
