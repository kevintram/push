# Fix ReviewSessionReadWithReviews Schema for Entity Conversion

## Overview

After converting topics to sources or practices, review sessions fail to serialize because `ReviewSessionReadWithReviews` uses `ReviewWithTopic` which requires a non-null `topic` field. Converted reviews have `topic_id=NULL` with `source_id` or `practice_id` set instead.

## Current State Analysis

**The Error:**
```
pydantic_core._pydantic_core.ValidationError: 4 validation errors for ReviewSessionReadWithReviews
reviews.19.topic
  Input should be a valid dictionary or object to extract fields from [type=model_attributes_type, input_value=None, input_type=NoneType]
```

**Root Cause:** `apps/api/app/schemas/review_sessions.py:32`
```python
class ReviewSessionReadWithReviews(ReviewSessionRead):
    reviews: list["ReviewWithTopic"]  # ← Requires topic to be non-null
```

**Why it fails:** After entity conversion:
1. Review's `topic_id` is set to `NULL`
2. Review's `source_id` or `practice_id` is set to the new entity
3. The `topic` relationship returns `None`
4. `ReviewWithTopic` schema validation fails because `topic: TopicRead` is required

**Existing solution:** `ReviewListItem` at `reviews.py:86-94` already handles polymorphic reviews:
```python
class ReviewListItem(ReviewRead):
    topic: TopicSummary | None = None
    source: SourceSummary | None = None
    practice: PracticeSummary | None = None
```

## Desired End State

`ReviewSessionReadWithReviews` should serialize review sessions containing reviews that reference topics, sources, OR practices without validation errors.

## What We're NOT Doing

- Not changing the web frontend types (already handles optional entities)
- Not creating a new schema type (reusing existing `ReviewListItem`)
- Not modifying any other API endpoints or schemas

## Implementation Approach

Simple schema change: replace `ReviewWithTopic` with `ReviewListItem` in `ReviewSessionReadWithReviews`.

## Phase 1: Fix Schema

### Changes Required

#### 1. Update ReviewSessionReadWithReviews Schema
**File**: `apps/api/app/schemas/review_sessions.py`

**Change**: Replace `ReviewWithTopic` import and usage with `ReviewListItem`

```python
# Before (lines 8-9):
if TYPE_CHECKING:
    from app.schemas.reviews import ReviewWithTopic

# After:
if TYPE_CHECKING:
    from app.schemas.reviews import ReviewListItem
```

```python
# Before (line 32):
reviews: list["ReviewWithTopic"]

# After:
reviews: list["ReviewListItem"]
```

**Rationale**: `ReviewListItem` already exists and correctly handles all three entity types as optional. No new schema needed.

### Success Criteria

#### Automated Verification:
- [ ] Command: `cd apps/api && uv run pytest tests/topics/test_conversion.py -v`
- [ ] Command: `cd apps/api && uv run pytest -v` (full test suite)
- [ ] Command: `cd apps/api && uv run ruff check`

#### Manual Verification:
- [ ] Convert a topic to source, then view review sessions containing reviews for that topic - should not error
- [ ] Convert a topic to practice, then view review sessions - should not error
- [ ] Review sessions containing mixed reviews (topic, source, practice) serialize correctly

## Testing Strategy

The existing conversion tests already create reviews and verify they're migrated. After this fix, endpoints returning `ReviewSessionReadWithReviews` will work with converted reviews.

## References
- Entity conversion commits: 955e397, d66b96a, bcefea4
- Related schemas: `apps/api/app/schemas/reviews.py`
