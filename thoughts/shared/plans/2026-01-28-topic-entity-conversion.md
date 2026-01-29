# Topic Entity Conversion Implementation Plan

## Overview

Add the ability to convert Topics to either Sources or Practices. This is a one-way, destructive conversion that transforms a Topic entity into a different entity type while preserving relevant data and relationships.

## Current State Analysis

### Entity Model Summary

| Entity | Primary Field | Has Children | Has Practices | Has Entity Relations |
|--------|--------------|--------------|---------------|---------------------|
| Topic | `name` | Yes (parent_id) | Yes (practice_topics) | Yes (entity_relations) |
| Source | `title` | Yes (parent_id) | Yes (practice_sources) | Yes (entity_relations) |
| Practice | `prompt` + `answer` | No | N/A | No |

### Key Relationships (from `apps/api/app/models/`)

1. **Topic → Source (covering)**: `source_topics` junction table - "source covers topic"
2. **Topic → Practice**: `practice_topics` junction table - "practice assesses topic"
3. **Topic → Topic (parent/child)**: `topics.parent_id` self-reference
4. **Topic ↔ Entity (related)**: `entity_relations` table - polymorphic relations

### API Pattern (from `apps/api/app/topics/service.py`)
- Services handle business logic + data access
- Domain exceptions (`ConflictError`, `BadRequestError`) translate to HTTP status codes
- Routers are thin HTTP handlers delegating to services

### Frontend Pattern (from `apps/web/src/features/topics/`)
- API functions in `api/` folder with React Query hooks
- `TopicActionMenu.tsx` handles dropdown actions
- `toast.error()` from sonner for error notifications
- Navigation via TanStack Router

## Desired End State

### Topic → Source Conversion

**Transformation:**
- Topic `name` → Source `title`
- Topic `notes` → Source `notes`
- Topic FSRS state → Source FSRS state (preserve or recreate)
- Topic flags (archived, inboxed) → Source flags
- Child topics → Child sources (recursive conversion)
- Related entities → Related entities (preserved)
- Linked practices → Linked to new source (via `practice_sources`)

**Blocking Condition:**
- Any topic in the subtree has sources covering it (via `source_topics`)

### Topic → Practice Conversion

**Transformation:**
- Topic `name` → Practice `prompt`
- Topic `notes` → Practice `answer`
- Topic FSRS state → Practice FSRS state (preserve or recreate)
- Topic flags (archived, inboxed) → Practice flags
- Parent topics → Associated topics (via `practice_topics`)
- Related topics → Associated topics (via `practice_topics`)

**Blocking Conditions:**
- Topic has any linked practices (via `practice_topics`)
- Topic has any sources covering it (via `source_topics`)

### UI Behavior

- "Convert to Source" and "Convert to Practice" appear in TopicActionMenu
- On success: navigate to new entity's detail page
- On failure: show sonner toast with error reason

## What We're NOT Doing

- Source → Topic conversion (not requested)
- Source → Practice conversion (not requested)
- Practice → Topic/Source conversion (not requested)
- Batch/bulk conversions
- Undo/rollback functionality
- Preserving original topic ID (new entity gets new ID)

## Implementation Approach

The conversion will be implemented as a single atomic API operation that:
1. Validates preconditions
2. Creates the new entity with all relationships
3. Deletes the original topic
4. Returns the new entity ID

This approach ensures data consistency and avoids orphaned relationships.

---

## Phase 1: Backend

### Overview

Create the conversion service functions, API endpoints, and comprehensive tests.

### Changes Required

#### 1. New Exception Class

**File**: `apps/api/app/exceptions.py`

Add a new exception for conversion-specific errors:

```python
class ConversionBlockedError(ConflictError):
    """Conversion is blocked due to incompatible relationships."""

    def __init__(self, reason: str):
        super().__init__(f"Cannot convert: {reason}")
```

**Rationale**: Provides clear error messaging for conversion failures, maps to 409 Conflict.

#### 2. Topic Conversion Service Functions

**File**: `apps/api/app/topics/service.py`

Add these new functions:

```python
async def check_topic_convertible_to_source(
    session: AsyncSession, topic_id: int, user_id: str
) -> tuple[bool, str | None]:
    """Check if a topic (and its subtree) can be converted to a source.

    Returns (can_convert, error_reason).
    Fails if any topic in subtree has sources covering it.
    """
    # Use ltree to get all descendants including self
    # Check if any have entries in source_topics
    pass


async def check_topic_convertible_to_practice(
    session: AsyncSession, topic_id: int, user_id: str
) -> tuple[bool, str | None]:
    """Check if a topic can be converted to a practice.

    Returns (can_convert, error_reason).
    Fails if topic has:
    - Linked practices (practice_topics)
    - Sources covering it (source_topics)
    """
    pass


async def convert_topic_to_source(
    session: AsyncSession, topic_id: int, user_id: str
) -> int:
    """Convert a topic (and its subtree) to a source hierarchy.

    Returns the new root source ID.

    Transformation:
    - Topic name -> Source title
    - Topic notes -> Source notes
    - Topic FSRS state -> New Source FSRS state
    - Topic flags -> Source flags
    - Child topics -> Child sources (recursive)
    - Entity relations -> Entity relations (from_source_id instead of from_topic_id)
    - Linked practices -> practice_sources entries

    Raises ConversionBlockedError if any subtree topic has covering sources.
    """
    pass


async def convert_topic_to_practice(
    session: AsyncSession, topic_id: int, user_id: str
) -> int:
    """Convert a topic to a practice.

    Returns the new practice ID.

    Transformation:
    - Topic name -> Practice prompt
    - Topic notes -> Practice answer
    - Topic FSRS state -> New Practice FSRS state
    - Topic flags -> Practice flags
    - Parent topics -> practice_topics entries
    - Related topics -> practice_topics entries

    Raises ConversionBlockedError if topic has practices or covering sources.
    """
    pass
```

**Implementation Details for `convert_topic_to_source`:**

```python
async def convert_topic_to_source(
    session: AsyncSession, topic_id: int, user_id: str
) -> int:
    """Convert a topic (and its subtree) to a source hierarchy."""
    from app.models import (
        EntityRelation, FsrsState, Practice, Source, Topic,
        t_practice_sources, t_practice_topics, t_source_topics
    )

    # 1. Verify topic exists
    root_topic = await get_topic(session, topic_id, user_id)

    # 2. Check convertibility (recursive check for covering sources)
    can_convert, reason = await check_topic_convertible_to_source(session, topic_id, user_id)
    if not can_convert:
        raise ConversionBlockedError(reason)

    # 3. Get all topics in subtree (using ltree path)
    subtree_stmt = select(Topic).where(
        Topic.user_id == user_id,
        text("topics.path <@ (SELECT path FROM topics WHERE id = :root_id)").bindparams(root_id=topic_id)
    ).options(
        selectinload(Topic.fsrs_state),
        selectinload(Topic.practices),
    )
    result = await session.execute(subtree_stmt)
    all_topics = list(result.scalars().all())

    # 4. Build topic_id -> new_source mapping
    topic_to_source: dict[int, Source] = {}

    # Sort by path length to process parents before children
    all_topics.sort(key=lambda t: len(t.path or ""))

    for topic in all_topics:
        # Create new FSRS state if topic had one
        new_fsrs_state_id = None
        if topic.fsrs_state:
            new_fsrs = FsrsState(
                srs_enabled=topic.fsrs_state.srs_enabled,
                stability=topic.fsrs_state.stability,
                difficulty=topic.fsrs_state.difficulty,
                state=topic.fsrs_state.state,
                step=topic.fsrs_state.step,
                last_reviewed_at=topic.fsrs_state.last_reviewed_at,
                inherited_stability=topic.fsrs_state.inherited_stability,
                inherited_difficulty=topic.fsrs_state.inherited_difficulty,
                inherited_state=topic.fsrs_state.inherited_state,
                inherited_step=topic.fsrs_state.inherited_step,
                inherited_last_review=topic.fsrs_state.inherited_last_review,
            )
            session.add(new_fsrs)
            await session.flush()
            new_fsrs_state_id = new_fsrs.id

        # Determine parent source ID
        parent_source_id = None
        if topic.parent_id and topic.parent_id in topic_to_source:
            parent_source_id = topic_to_source[topic.parent_id].id

        # Create source
        new_source = Source(
            user_id=user_id,
            title=topic.name,
            notes=topic.notes,
            parent_id=parent_source_id,
            fsrs_state_id=new_fsrs_state_id,
            archived=topic.archived,
            inboxed=topic.inboxed,
        )
        session.add(new_source)
        await session.flush()

        topic_to_source[topic.id] = new_source

        # Migrate practices to new source
        for practice in topic.practices:
            await session.execute(
                t_practice_sources.insert().values(
                    practice_id=practice.id,
                    source_id=new_source.id,
                )
            )

    # 5. Migrate entity relations
    # Update outgoing relations: from_topic_id -> from_source_id
    for topic in all_topics:
        new_source = topic_to_source[topic.id]

        # Get outgoing relations
        outgoing = await session.execute(
            select(EntityRelation).where(EntityRelation.from_topic_id == topic.id)
        )
        for rel in outgoing.scalars():
            # Create new relation from source
            new_rel = EntityRelation(
                from_source_id=new_source.id,
                to_topic_id=rel.to_topic_id,
                to_source_id=rel.to_source_id,
            )
            session.add(new_rel)

        # Get incoming relations where to_topic_id points to this topic
        incoming = await session.execute(
            select(EntityRelation).where(EntityRelation.to_topic_id == topic.id)
        )
        for rel in incoming.scalars():
            # Create new relation pointing to source
            new_rel = EntityRelation(
                from_topic_id=rel.from_topic_id,
                from_source_id=rel.from_source_id,
                to_source_id=new_source.id,
            )
            session.add(new_rel)

    # 6. Delete original topics (cascade will clean up old relations)
    # Delete in reverse order (children first) to respect FK constraints
    all_topics.sort(key=lambda t: len(t.path or ""), reverse=True)
    for topic in all_topics:
        await session.delete(topic)

    await session.commit()

    return topic_to_source[topic_id].id
```

**Implementation Details for `convert_topic_to_practice`:**

```python
async def convert_topic_to_practice(
    session: AsyncSession, topic_id: int, user_id: str
) -> int:
    """Convert a topic to a practice."""
    from app.models import FsrsState, Practice, Topic, t_practice_topics

    # 1. Verify topic exists
    topic = await load_topic_with_relationships(session, topic_id, user_id)

    # 2. Check convertibility
    can_convert, reason = await check_topic_convertible_to_practice(session, topic_id, user_id)
    if not can_convert:
        raise ConversionBlockedError(reason)

    # 3. Create new FSRS state if needed
    new_fsrs_state_id = None
    if topic.fsrs_state:
        new_fsrs = FsrsState(
            srs_enabled=topic.fsrs_state.srs_enabled,
            stability=topic.fsrs_state.stability,
            difficulty=topic.fsrs_state.difficulty,
            state=topic.fsrs_state.state,
            step=topic.fsrs_state.step,
            last_reviewed_at=topic.fsrs_state.last_reviewed_at,
        )
        session.add(new_fsrs)
        await session.flush()
        new_fsrs_state_id = new_fsrs.id

    # 4. Create practice
    new_practice = Practice(
        user_id=user_id,
        prompt=topic.name,
        answer=topic.notes,
        fsrs_state_id=new_fsrs_state_id,
        archived=topic.archived,
        inboxed=topic.inboxed,
    )
    session.add(new_practice)
    await session.flush()

    # 5. Collect associated topics (parents + related topics)
    associated_topic_ids: set[int] = set()

    # Add parent topics (walk up the tree)
    current = topic
    while current.parent_id:
        associated_topic_ids.add(current.parent_id)
        parent_result = await session.execute(
            select(Topic).where(Topic.id == current.parent_id, Topic.user_id == user_id)
        )
        current = parent_result.scalar_one_or_none()
        if not current:
            break

    # Add related topics (both directions, but only topics)
    outgoing, incoming = await get_topic_related(session, topic_id, user_id)
    for related_topic in outgoing:
        associated_topic_ids.add(related_topic.id)
    for related_topic in incoming:
        associated_topic_ids.add(related_topic.id)

    # 6. Create practice_topics entries
    for assoc_topic_id in associated_topic_ids:
        await session.execute(
            t_practice_topics.insert().values(
                practice_id=new_practice.id,
                topic_id=assoc_topic_id,
            )
        )

    # 7. Delete original topic
    await session.delete(topic)

    await session.commit()

    return new_practice.id
```

**Rationale**: Atomic operations ensure data consistency. Using ltree for subtree queries is efficient. Creating new FSRS states preserves learning progress.

#### 3. Topic Conversion Router Endpoints

**File**: `apps/api/app/topics/router.py`

Add new endpoints:

```python
from app.schemas.topics import ConvertToSourceResponse, ConvertToPracticeResponse


@router.post("/{topic_id}/convert-to-source/")
async def convert_topic_to_source_endpoint(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> ConvertToSourceResponse:
    """Convert a topic and its subtree to sources.

    Returns the new root source ID.
    Fails with 409 if any topic in subtree has sources covering it.
    """
    new_source_id = await service.convert_topic_to_source(session, topic_id, user_id)
    return ConvertToSourceResponse(source_id=new_source_id)


@router.post("/{topic_id}/convert-to-practice/")
async def convert_topic_to_practice_endpoint(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> ConvertToPracticeResponse:
    """Convert a topic to a practice.

    Returns the new practice ID.
    Fails with 409 if topic has practices or sources covering it.
    """
    new_practice_id = await service.convert_topic_to_practice(session, topic_id, user_id)
    return ConvertToPracticeResponse(practice_id=new_practice_id)
```

#### 4. Response Schemas

**File**: `apps/api/app/schemas/topics.py`

Add response schemas:

```python
class ConvertToSourceResponse(BaseModel):
    source_id: int


class ConvertToPracticeResponse(BaseModel):
    practice_id: int
```

### Success Criteria

#### Automated Verification:
- [ ] Command: `cd apps/api && uv run pytest tests/topics/test_conversion.py -v`
- [ ] Command: `cd apps/api && uv run ruff check --fix`
- [ ] Command: `cd apps/api && uv run ruff format`

### Backend Tests

#### Conversion Test File

**File**: `apps/api/tests/topics/test_conversion.py`

```python
"""Tests for topic entity conversion."""

import pytest
from httpx import AsyncClient

from app.models import Practice, Source, Topic


class TestConvertTopicToSource:
    """Tests for Topic -> Source conversion."""

    async def test_convert_simple_topic(
        self, client: AsyncClient, topic_factory, user_id: str
    ):
        """Converting a topic with no children or relationships works."""
        topic = await topic_factory(name="Test Topic", notes="Some notes")

        response = await client.post(f"/topics/{topic.id}/convert-to-source/")

        assert response.status_code == 200
        data = response.json()
        assert "source_id" in data

        # Verify source was created
        source_response = await client.get(f"/sources/{data['source_id']}/")
        assert source_response.status_code == 200
        source_data = source_response.json()
        assert source_data["title"] == "Test Topic"
        assert source_data["notes"] == "Some notes"

        # Verify topic was deleted
        topic_response = await client.get(f"/topics/{topic.id}/")
        assert topic_response.status_code == 404

    async def test_convert_topic_with_children(
        self, client: AsyncClient, topic_factory, user_id: str
    ):
        """Converting a topic with children converts entire subtree."""
        parent = await topic_factory(name="Parent")
        child1 = await topic_factory(name="Child 1", parent_id=parent.id)
        child2 = await topic_factory(name="Child 2", parent_id=parent.id)
        grandchild = await topic_factory(name="Grandchild", parent_id=child1.id)

        response = await client.post(f"/topics/{parent.id}/convert-to-source/")

        assert response.status_code == 200
        new_source_id = response.json()["source_id"]

        # Verify hierarchy is preserved
        source_response = await client.get(f"/sources/{new_source_id}/")
        source_data = source_response.json()
        assert len(source_data["children"]) == 2

    async def test_convert_topic_with_practices(
        self, client: AsyncClient, topic_factory, practice_factory, user_id: str
    ):
        """Practices linked to topic become linked to new source."""
        topic = await topic_factory(name="Test Topic")
        practice = await practice_factory(prompt="Test Practice")
        await client.post(f"/topics/{topic.id}/practices/{practice.id}/")

        response = await client.post(f"/topics/{topic.id}/convert-to-source/")

        assert response.status_code == 200
        new_source_id = response.json()["source_id"]

        # Verify practice is linked to new source
        source_response = await client.get(f"/sources/{new_source_id}/")
        source_data = source_response.json()
        assert len(source_data["practices"]) == 1
        assert source_data["practices"][0]["id"] == practice.id

    async def test_convert_blocked_by_covering_source(
        self, client: AsyncClient, topic_factory, source_factory, user_id: str
    ):
        """Conversion fails if topic has sources covering it."""
        topic = await topic_factory(name="Test Topic")
        source = await source_factory(title="Covering Source")
        await client.post(f"/sources/{source.id}/topics/{topic.id}/")

        response = await client.post(f"/topics/{topic.id}/convert-to-source/")

        assert response.status_code == 409
        assert "sources covering" in response.json()["detail"].lower()

    async def test_convert_blocked_by_child_covering_source(
        self, client: AsyncClient, topic_factory, source_factory, user_id: str
    ):
        """Conversion fails if any child topic has sources covering it."""
        parent = await topic_factory(name="Parent")
        child = await topic_factory(name="Child", parent_id=parent.id)
        source = await source_factory(title="Covering Source")
        await client.post(f"/sources/{source.id}/topics/{child.id}/")

        response = await client.post(f"/topics/{parent.id}/convert-to-source/")

        assert response.status_code == 409


class TestConvertTopicToPractice:
    """Tests for Topic -> Practice conversion."""

    async def test_convert_simple_topic(
        self, client: AsyncClient, topic_factory, user_id: str
    ):
        """Converting a topic with no blocking relationships works."""
        topic = await topic_factory(name="Test Topic", notes="Answer text")

        response = await client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 200
        data = response.json()
        assert "practice_id" in data

        # Verify practice was created
        practice_response = await client.get(f"/practices/{data['practice_id']}/")
        assert practice_response.status_code == 200
        practice_data = practice_response.json()
        assert practice_data["prompt"] == "Test Topic"
        assert practice_data["answer"] == "Answer text"

    async def test_convert_topic_with_parents(
        self, client: AsyncClient, topic_factory, user_id: str
    ):
        """Parent topics become associated topics of the new practice."""
        grandparent = await topic_factory(name="Grandparent")
        parent = await topic_factory(name="Parent", parent_id=grandparent.id)
        topic = await topic_factory(name="Topic", parent_id=parent.id)

        response = await client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 200
        practice_id = response.json()["practice_id"]

        # Verify parent topics are associated
        practice_response = await client.get(f"/practices/{practice_id}/")
        practice_data = practice_response.json()
        topic_ids = [t["id"] for t in practice_data["topics"]]
        assert grandparent.id in topic_ids
        assert parent.id in topic_ids

    async def test_convert_topic_with_related_topics(
        self, client: AsyncClient, topic_factory, user_id: str
    ):
        """Related topics become associated topics of the new practice."""
        topic = await topic_factory(name="Topic")
        related1 = await topic_factory(name="Related 1")
        related2 = await topic_factory(name="Related 2")
        await client.post(f"/topics/{topic.id}/entity-relations/", json={
            "to_entity_type": "topic",
            "to_entity_id": related1.id
        })

        response = await client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 200
        practice_id = response.json()["practice_id"]

        # Verify related topic is associated
        practice_response = await client.get(f"/practices/{practice_id}/")
        practice_data = practice_response.json()
        topic_ids = [t["id"] for t in practice_data["topics"]]
        assert related1.id in topic_ids

    async def test_convert_blocked_by_existing_practices(
        self, client: AsyncClient, topic_factory, practice_factory, user_id: str
    ):
        """Conversion fails if topic has linked practices."""
        topic = await topic_factory(name="Test Topic")
        practice = await practice_factory(prompt="Test Practice")
        await client.post(f"/topics/{topic.id}/practices/{practice.id}/")

        response = await client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 409
        assert "practice" in response.json()["detail"].lower()

    async def test_convert_blocked_by_covering_source(
        self, client: AsyncClient, topic_factory, source_factory, user_id: str
    ):
        """Conversion fails if topic has sources covering it."""
        topic = await topic_factory(name="Test Topic")
        source = await source_factory(title="Covering Source")
        await client.post(f"/sources/{source.id}/topics/{topic.id}/")

        response = await client.post(f"/topics/{topic.id}/convert-to-practice/")

        assert response.status_code == 409
        assert "source" in response.json()["detail"].lower()
```

**Implementation Note**: Pause after automated verification for manual testing before proceeding to Phase 2.

---

## Phase 2: Frontend

### Overview

Create frontend API functions, React Query hooks, and UI integration for the conversion endpoints.

### Changes Required

#### 1. Convert Topic to Source API

**File**: `apps/web/src/features/topics/api/convertTopicToSource.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export type ConvertTopicToSourceInput = {
    topicId: number
}

export type ConvertTopicToSourceResponse = {
    source_id: number
}

export class ConversionError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message)
        this.name = 'ConversionError'
    }
}

export async function convertTopicToSource(
    input: ConvertTopicToSourceInput
): Promise<ConvertTopicToSourceResponse> {
    const response = await apiFetch(
        `${import.meta.env.VITE_API_URL}/topics/${input.topicId}/convert-to-source/`,
        {
            method: 'POST'
        }
    )

    if (!response.ok) {
        const data = await response.json().catch(() => ({ detail: 'Conversion failed' }))
        throw new ConversionError(
            data.detail || 'Failed to convert topic to source',
            response.status
        )
    }

    return response.json()
}

export function useConvertTopicToSource() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: convertTopicToSource,
        onSuccess: () => {
            // Invalidate all affected queries
            queryClient.invalidateQueries({ queryKey: topicKeys.all })
            queryClient.invalidateQueries({ queryKey: sourceKeys.all })
            queryClient.invalidateQueries({ queryKey: practiceKeys.all })
            queryClient.invalidateQueries({ queryKey: reviewKeys.all })
        }
    })
}
```

#### 2. Convert Topic to Practice API

**File**: `apps/web/src/features/topics/api/convertTopicToPractice.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export type ConvertTopicToPracticeInput = {
    topicId: number
}

export type ConvertTopicToPracticeResponse = {
    practice_id: number
}

export class ConversionError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message)
        this.name = 'ConversionError'
    }
}

export async function convertTopicToPractice(
    input: ConvertTopicToPracticeInput
): Promise<ConvertTopicToPracticeResponse> {
    const response = await apiFetch(
        `${import.meta.env.VITE_API_URL}/topics/${input.topicId}/convert-to-practice/`,
        {
            method: 'POST'
        }
    )

    if (!response.ok) {
        const data = await response.json().catch(() => ({ detail: 'Conversion failed' }))
        throw new ConversionError(
            data.detail || 'Failed to convert topic to practice',
            response.status
        )
    }

    return response.json()
}

export function useConvertTopicToPractice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: convertTopicToPractice,
        onSuccess: () => {
            // Invalidate all affected queries
            queryClient.invalidateQueries({ queryKey: topicKeys.all })
            queryClient.invalidateQueries({ queryKey: practiceKeys.all })
            queryClient.invalidateQueries({ queryKey: reviewKeys.all })
        }
    })
}
```

#### 3. Export from index (if exists)

Check if there's an index.ts that needs updating in `apps/web/src/features/topics/api/`.

### UI Integration

#### Update TopicActionMenu

**File**: `apps/web/src/features/topics/components/TopicActionMenu.tsx`

Add imports:
```typescript
import { RefreshCw } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
    ConversionError,
    useConvertTopicToSource
} from '~/features/topics/api/convertTopicToSource'
import { useConvertTopicToPractice } from '~/features/topics/api/convertTopicToPractice'
```

Add hooks in component:
```typescript
const navigate = useNavigate()
const convertToSourceMutation = useConvertTopicToSource()
const convertToPracticeMutation = useConvertTopicToPractice()
```

Add handlers:
```typescript
const handleConvertToSource = useCallback(
    async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            const result = await convertToSourceMutation.mutateAsync({
                topicId: topic.id
            })
            navigate({ to: '/sources/$sourceId', params: { sourceId: String(result.source_id) } })
        } catch (error) {
            if (error instanceof ConversionError) {
                toast.error(error.message)
            } else {
                toast.error('Failed to convert topic to source')
            }
        }
    },
    [convertToSourceMutation, topic.id, navigate]
)

const handleConvertToPractice = useCallback(
    async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            const result = await convertToPracticeMutation.mutateAsync({
                topicId: topic.id
            })
            navigate({ to: '/practices/$practiceId', params: { practiceId: String(result.practice_id) } })
        } catch (error) {
            if (error instanceof ConversionError) {
                toast.error(error.message)
            } else {
                toast.error('Failed to convert topic to practice')
            }
        }
    },
    [convertToPracticeMutation, topic.id, navigate]
)
```

Add menu items (before the Delete item):
```typescript
<DropdownMenuItem
    onClick={handleConvertToSource}
    disabled={convertToSourceMutation.isPending}
>
    <RefreshCw className='mr-2 h-4 w-4' />
    Convert to Source
</DropdownMenuItem>
<DropdownMenuItem
    onClick={handleConvertToPractice}
    disabled={convertToPracticeMutation.isPending}
>
    <RefreshCw className='mr-2 h-4 w-4' />
    Convert to Practice
</DropdownMenuItem>
```

### Success Criteria

#### Automated Verification:
- [ ] Command: `cd apps/web && pnpm run lint:tsc`
- [ ] Command: `cd apps/web && pnpm run lint:biome`

#### Manual Verification:
- [ ] TypeScript types are correct
- [ ] Hooks properly invalidate relevant queries
- [ ] "Convert to Source" and "Convert to Practice" appear in topic dropdown menu
- [ ] Clicking "Convert to Source" converts topic and navigates to new source
- [ ] Clicking "Convert to Practice" converts topic and navigates to new practice
- [ ] Error toast appears when conversion fails with clear reason
- [ ] Menu items show loading state during conversion

---

## Testing Strategy

### Backend Tests
- Unit tests for service functions (validation, transformation)
- Integration tests for API endpoints
- Edge cases: empty subtrees, deep hierarchies, multiple relationships

### Frontend Tests
- Component tests for TopicActionMenu with new options
- Mock API responses for success and failure cases

### Manual E2E Testing
1. Create topic hierarchy with various relationships
2. Test successful conversions
3. Test blocked conversions with appropriate error messages
4. Verify all data is properly migrated
5. Verify original entities are deleted

## Performance Considerations

- Subtree queries use ltree for O(1) ancestry checks
- Batch operations where possible to reduce round trips
- Single transaction ensures atomicity without multiple commits

## Migration Notes

- No database migration needed (using existing tables)
- No breaking changes to existing API endpoints
- Feature is additive only

## References

- Topic model: `apps/api/app/models/topics.py`
- Source model: `apps/api/app/models/sources.py`
- Practice model: `apps/api/app/models/practices.py`
- TopicActionMenu: `apps/web/src/features/topics/components/TopicActionMenu.tsx`
- Exception handlers: `apps/api/app/exception_handlers.py`
