# Phase 4 Remaining E2E Tests - Implementation Plan

## Overview

Complete the remaining E2E tests for entity relations by adding frontend support for cross-entity relations. The backend API is fully implemented; this plan focuses on exposing entity relations through the detail endpoints and adding frontend UI components.

**What we're building:**
1. Topic → Source relations (from Topic detail)
2. Source → Topic relations (from Source detail)
3. Source → Source relations (from Source detail)
4. Related panel UI with type distinction (showing topic vs source)

## Current State Analysis

### What's Already Working

**Backend - Fully Implemented:**
- `POST /topics/{id}/entity-relations/` - Add relation from topic to topic/source
- `DELETE /topics/{id}/entity-relations/{type}/{id}/` - Remove relation
- `POST /sources/{id}/entity-relations/` - Add relation from source to topic/source
- `DELETE /sources/{id}/entity-relations/{type}/{id}/` - Remove relation
- `SourcePrerequisiteRead` schema with `prereq_topic` and `prereq_source` fields

**Frontend - Fully Implemented:**
- `SourcePrerequisitesPanel` - Works for both topic and source prerequisites
- `AddPrerequisiteDialog` - Search and add topics/sources as prerequisites

### What's Missing

**Backend - Schema/Endpoint Gaps:**
| Component | Issue | Location |
|-----------|-------|----------|
| `SourceDetailRead` | Missing `related_outgoing` and `related_incoming` fields | `apps/api/app/schemas/sources.py:60-68` |
| Source detail endpoint | Doesn't fetch/return entity relations | `apps/api/app/sources/router.py:74-78` |
| Topic detail endpoint | Returns only topic relations (not sources) | `apps/api/app/topics/router.py:76-94` |

**Frontend - Component Gaps:**
| Component | Issue | Location |
|-----------|-------|----------|
| `TopicRelatedPanel` | Only handles topic-to-topic relations | `apps/web/src/features/topics/components/TopicRelatedPanel.tsx` |
| `SourceRelatedPanel` | Does not exist | N/A |
| Source types | Has count fields but not actual relation arrays | `apps/web/src/features/sources/types/source.types.ts` |

## Desired End State

After implementation:
- Topic detail page shows related topics AND sources in the Related panel
- Source detail page shows related topics AND sources in a new Related panel
- Both panels distinguish between topic and source entities visually (icons/labels)
- All four relation types work end-to-end:
  - Topic → Topic ✅ (already works)
  - Topic → Source (NEW)
  - Source → Topic (NEW)
  - Source → Source (NEW)

## What We're NOT Doing

- **No backend API changes for endpoints** - The entity-relations endpoints already work
- **No database changes** - `entity_relations` table is complete
- **No new API hooks for entity relations** - We'll use the existing schema patterns
- **No changes to prerequisites** - Already fully functional

## Implementation Approach

We'll make changes in two phases:
1. **Phase A (Backend)**: Update schemas and endpoints to include related entities in detail responses
2. **Phase B (Frontend)**: Update/create components to display and manage cross-entity relations

---

## Phase A: Backend Schema & Endpoint Updates

### Overview
Update the API to include `related_outgoing` and `related_incoming` in both topic and source detail responses, supporting both topic and source entities.

### Changes Required

#### 1. Add RelatedEntityRead to Source Schema Imports

**File**: `apps/api/app/schemas/sources.py`

**Changes**: Import `RelatedEntityRead` from entity_relations schema.

```python
# At the top, add import
from app.schemas.entity_relations import RelatedEntityRead
```

**Rationale**: Needed for the new fields in SourceDetailRead.

#### 2. Update SourceDetailRead Schema

**File**: `apps/api/app/schemas/sources.py:60-68`

**Changes**: Add `related_outgoing` and `related_incoming` fields.

```python
class SourceDetailRead(SourceSummaryRead):
    """Source with full relationships loaded for detail views."""

    model_config = ConfigDict(from_attributes=True)

    parent: SourceSummaryRead | None = None
    children: list[SourceSummaryRead] = []
    topics: list[TopicSummaryRead] = []
    related_outgoing: list[RelatedEntityRead] = []
    related_incoming: list[RelatedEntityRead] = []
```

**Rationale**: The schema needs to expose the related entities that the API returns.

#### 3. Create Service Function to Get Source Related Entities

**File**: `apps/api/app/sources/service.py`

**Changes**: Add function to fetch related entities for a source.

```python
async def get_source_related_entities(
    session: AsyncSession, source_id: int, user_id: str
) -> tuple[list[dict], list[dict]]:
    """Get outgoing and incoming entity relations for a source.

    Returns:
        Tuple of (outgoing_relations, incoming_relations) where each item is a dict
        with entity_type, id, name (for topics), and title (for sources).
    """
    from app.models import EntityRelation, Topic, Source
    from sqlalchemy.orm import selectinload

    # Fetch outgoing relations (from this source to other entities)
    outgoing_stmt = (
        select(EntityRelation)
        .where(EntityRelation.from_source_id == source_id)
        .options(
            selectinload(EntityRelation.to_topic),
            selectinload(EntityRelation.to_source),
        )
    )
    outgoing_result = await session.execute(outgoing_stmt)
    outgoing_relations = outgoing_result.scalars().all()

    outgoing = []
    for rel in outgoing_relations:
        if rel.to_topic_id:
            # Verify topic belongs to user
            if rel.to_topic and rel.to_topic.user_id == user_id:
                outgoing.append({
                    "entity_type": "topic",
                    "id": rel.to_topic.id,
                    "name": rel.to_topic.name,
                    "title": None,
                })
        elif rel.to_source_id:
            # Verify source belongs to user
            if rel.to_source and rel.to_source.user_id == user_id:
                outgoing.append({
                    "entity_type": "source",
                    "id": rel.to_source.id,
                    "name": None,
                    "title": rel.to_source.title,
                })

    # Fetch incoming relations (from other entities to this source)
    incoming_stmt = (
        select(EntityRelation)
        .where(EntityRelation.to_source_id == source_id)
        .options(
            selectinload(EntityRelation.from_topic),
            selectinload(EntityRelation.from_source),
        )
    )
    incoming_result = await session.execute(incoming_stmt)
    incoming_relations = incoming_result.scalars().all()

    incoming = []
    for rel in incoming_relations:
        if rel.from_topic_id:
            if rel.from_topic and rel.from_topic.user_id == user_id:
                incoming.append({
                    "entity_type": "topic",
                    "id": rel.from_topic.id,
                    "name": rel.from_topic.name,
                    "title": None,
                })
        elif rel.from_source_id:
            if rel.from_source and rel.from_source.user_id == user_id:
                incoming.append({
                    "entity_type": "source",
                    "id": rel.from_source.id,
                    "name": None,
                    "title": rel.from_source.title,
                })

    return outgoing, incoming
```

**Rationale**: Follows the same pattern as `get_topic_related` in topics service.

#### 4. Update Source Detail Router Endpoint

**File**: `apps/api/app/sources/router.py:74-78`

**Changes**: Fetch related entities and include them in the response.

```python
@router.get("/{source_id}/")
async def read_source(
    session: SessionDep, user_id: UserIdDep, source_id: int
) -> SourceDetailRead:
    source = await service.load_source_with_relationships(session, source_id, user_id)

    # Fetch related entities and add them to the response
    outgoing, incoming = await service.get_source_related_entities(
        session, source_id, user_id
    )

    source_data = SourceDetailRead.model_validate(source).model_dump()
    source_data["related_outgoing"] = outgoing
    source_data["related_incoming"] = incoming

    return SourceDetailRead(**source_data)
```

**Rationale**: Matches the pattern used in the topics router for related entities.

#### 5. Create Service Function to Get Topic Related Entities (Cross-Entity)

**File**: `apps/api/app/topics/service.py`

**Changes**: Add function to fetch all related entities (topics AND sources) for a topic.

```python
async def get_topic_related_entities(
    session: AsyncSession, topic_id: int, user_id: str
) -> tuple[list[dict], list[dict]]:
    """Get outgoing and incoming entity relations for a topic (including sources).

    Returns:
        Tuple of (outgoing_relations, incoming_relations) where each item is a dict
        with entity_type, id, name (for topics), and title (for sources).
    """
    from app.models import EntityRelation
    from sqlalchemy.orm import selectinload

    # Fetch outgoing relations (from this topic to other entities)
    outgoing_stmt = (
        select(EntityRelation)
        .where(EntityRelation.from_topic_id == topic_id)
        .options(
            selectinload(EntityRelation.to_topic),
            selectinload(EntityRelation.to_source),
        )
    )
    outgoing_result = await session.execute(outgoing_stmt)
    outgoing_relations = outgoing_result.scalars().all()

    outgoing = []
    for rel in outgoing_relations:
        if rel.to_topic_id:
            if rel.to_topic and rel.to_topic.user_id == user_id:
                outgoing.append({
                    "entity_type": "topic",
                    "id": rel.to_topic.id,
                    "name": rel.to_topic.name,
                    "title": None,
                })
        elif rel.to_source_id:
            if rel.to_source and rel.to_source.user_id == user_id:
                outgoing.append({
                    "entity_type": "source",
                    "id": rel.to_source.id,
                    "name": None,
                    "title": rel.to_source.title,
                })

    # Fetch incoming relations (from other entities to this topic)
    incoming_stmt = (
        select(EntityRelation)
        .where(EntityRelation.to_topic_id == topic_id)
        .options(
            selectinload(EntityRelation.from_topic),
            selectinload(EntityRelation.from_source),
        )
    )
    incoming_result = await session.execute(incoming_stmt)
    incoming_relations = incoming_result.scalars().all()

    incoming = []
    for rel in incoming_relations:
        if rel.from_topic_id:
            if rel.from_topic and rel.from_topic.user_id == user_id:
                incoming.append({
                    "entity_type": "topic",
                    "id": rel.from_topic.id,
                    "name": rel.from_topic.name,
                    "title": None,
                })
        elif rel.from_source_id:
            if rel.from_source and rel.from_source.user_id == user_id:
                incoming.append({
                    "entity_type": "source",
                    "id": rel.from_source.id,
                    "name": None,
                    "title": rel.from_source.title,
                })

    return outgoing, incoming
```

**Rationale**: The existing `get_topic_related` only returns topics. This new function returns both topics and sources.

#### 6. Update TopicDetailRead Schema

**File**: `apps/api/app/schemas/topics.py:71-80`

**Changes**: Change `related_outgoing` and `related_incoming` from `list[TopicSummaryRead]` to `list[RelatedEntityRead]`.

```python
from app.schemas.entity_relations import RelatedEntityRead

class TopicDetailRead(TopicSummaryRead):
    """Topic with full relationships loaded for detail views."""

    model_config = ConfigDict(from_attributes=True)

    parent: TopicSummaryRead | None = None
    children: list[TopicSummaryRead] = []
    related_outgoing: list[RelatedEntityRead] = []
    related_incoming: list[RelatedEntityRead] = []
    sources: list["SourceSummaryRead"] = []
```

**Rationale**: The schema needs to support both topic and source related entities.

#### 7. Update Topic Detail Router Endpoint

**File**: `apps/api/app/topics/router.py:76-94`

**Changes**: Use the new `get_topic_related_entities` function instead of `get_topic_related`.

```python
@router.get("/{topic_id}/")
async def read_topic(
    session: SessionDep, user_id: UserIdDep, topic_id: int
) -> TopicDetailRead:
    topic = await service.load_topic_with_relationships(session, topic_id, user_id)

    # Fetch related entities (topics AND sources) and add them to the response
    outgoing, incoming = await service.get_topic_related_entities(
        session, topic_id, user_id
    )

    topic_data = TopicDetailRead.model_validate(topic).model_dump()
    topic_data["related_outgoing"] = outgoing
    topic_data["related_incoming"] = incoming

    return TopicDetailRead(**topic_data)
```

**Rationale**: Now returns both topic and source relations.

### Success Criteria (Phase A)

#### Automated Verification:
- [x] Command: `cd apps/api && uv run pytest tests/` - All tests pass
- [x] Command: `cd apps/api && uv run ruff check --fix && uv run ruff format` - No lint errors

#### Manual Verification (API):
- [ ] `GET /topics/{id}/` returns `related_outgoing` with both topic and source entities
- [ ] `GET /topics/{id}/` returns `related_incoming` with both topic and source entities
- [ ] `GET /sources/{id}/` returns `related_outgoing` with both topic and source entities
- [ ] `GET /sources/{id}/` returns `related_incoming` with both topic and source entities

---

## Phase B: Frontend Components & Types

### Overview
Update frontend types and components to display and manage cross-entity relations.

### Changes Required

#### 1. Add RelatedEntity Type

**File**: `apps/web/src/models/entity-relations.types.ts`

**Changes**: Add type for related entities returned by detail endpoints.

```typescript
export type RelatedEntity = {
  entity_type: EntityType
  id: number
  name: string | null  // topic.name
  title: string | null // source.title
}
```

**Rationale**: Maps to the `RelatedEntityRead` schema from the backend.

#### 2. Update Source Type with Related Fields

**File**: `apps/web/src/features/sources/types/source.types.ts:39-43`

**Changes**: Add `related_outgoing` and `related_incoming` fields.

```typescript
import type { RelatedEntity } from '~/models/entity-relations.types'

export type Source = {
  // ... existing fields ...
  // Relationships (loaded conditionally)
  parent?: Source | null
  children?: Array<Source>
  topics?: Array<Topic>
  related_outgoing?: Array<RelatedEntity>
  related_incoming?: Array<RelatedEntity>
}
```

**Rationale**: Matches the updated backend schema.

#### 3. Update Source Schema Validation

**File**: `apps/web/src/features/sources/types/source.schemas.ts`

**Changes**: Add validation for `related_outgoing` and `related_incoming` in detail schema.

```typescript
import * as v from 'valibot'

const RelatedEntitySchema = v.object({
  entity_type: v.picklist(['topic', 'source']),
  id: v.number(),
  name: v.nullable(v.string()),
  title: v.nullable(v.string()),
})

// Update SourceDetailReadSchema to include:
related_outgoing: v.optional(v.array(RelatedEntitySchema)),
related_incoming: v.optional(v.array(RelatedEntitySchema)),
```

**Rationale**: Ensures proper parsing of the API response.

#### 4. Update Topic Type with Mixed Related Fields

**File**: `apps/web/src/features/topics/types/topic.types.ts:44-45`

**Changes**: Change `related_outgoing` and `related_incoming` to use `RelatedEntity`.

```typescript
import type { RelatedEntity } from '~/models/entity-relations.types'

export type Topic = {
  // ... existing fields ...
  related_outgoing?: Array<RelatedEntity>
  related_incoming?: Array<RelatedEntity>
  // ... rest of fields ...
}
```

**Rationale**: Matches the updated backend schema that can return both topics and sources.

#### 5. Update Topic Schema Validation

**File**: `apps/web/src/features/topics/types/topic.schemas.ts`

**Changes**: Update validation for `related_outgoing` and `related_incoming`.

```typescript
const RelatedEntitySchema = v.object({
  entity_type: v.picklist(['topic', 'source']),
  id: v.number(),
  name: v.nullable(v.string()),
  title: v.nullable(v.string()),
})

// Update TopicDetailReadSchema to include:
related_outgoing: v.optional(v.array(RelatedEntitySchema)),
related_incoming: v.optional(v.array(RelatedEntitySchema)),
```

**Rationale**: Ensures proper parsing of the API response with mixed entity types.

#### 6. Create SourceRelatedPanel Component

**File**: `apps/web/src/features/sources/components/SourceRelatedPanel.tsx` (new)

**Changes**: Create new component modeled after `SourcePrerequisitesPanel`.

```typescript
import { ChevronDown, Link, Loader2, Plus, X, FileText, BookOpen } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'
import type { RelatedEntity } from '~/models/entity-relations.types'
import { EntityType } from '~/models/entity-relations.types'
import { useAddSourceEntityRelation } from '../api/addSourceEntityRelation'
import { useRemoveSourceEntityRelation } from '../api/removeSourceEntityRelation'
import { AddEntityRelationDialog } from './AddEntityRelationDialog'

interface SourceRelatedPanelProps {
  sourceId: number | undefined
  relatedOutgoing?: Array<RelatedEntity>
  relatedIncoming?: Array<RelatedEntity>
  onTopicNavigate?: (topicId: number) => void
  onSourceNavigate?: (sourceId: number) => void
}

export function SourceRelatedPanel({
  sourceId,
  relatedOutgoing = [],
  relatedIncoming = [],
  onTopicNavigate,
  onSourceNavigate,
}: SourceRelatedPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const addRelation = useAddSourceEntityRelation()
  const removeRelation = useRemoveSourceEntityRelation()

  const isAdding = addRelation.isPending
  const isRemoving = removeRelation.isPending

  // Merge outgoing and incoming for display
  const allRelated = [
    ...relatedOutgoing.map(r => ({ ...r, direction: 'outgoing' as const })),
    ...relatedIncoming.map(r => ({ ...r, direction: 'incoming' as const })),
  ]

  const handleAdd = useCallback(
    (entityType: EntityType, entityId: number) => {
      if (!sourceId) return
      addRelation.mutate({
        sourceId,
        data: {
          to_entity_type: entityType,
          to_entity_id: entityId,
        },
      })
    },
    [sourceId, addRelation]
  )

  const handleRemove = useCallback(
    (entity: RelatedEntity, direction: 'outgoing' | 'incoming') => {
      if (!sourceId) return
      // For outgoing: we created the relation, delete from our source
      // For incoming: the other entity created the relation, we need to delete from their side
      // Simplified: always use our sourceId and the entity's type/id
      removeRelation.mutate({
        sourceId,
        entityType: entity.entity_type,
        entityId: entity.id,
      })
    },
    [sourceId, removeRelation]
  )

  const handleClick = useCallback(
    (entity: RelatedEntity) => {
      if (entity.entity_type === 'topic' && onTopicNavigate) {
        onTopicNavigate(entity.id)
      } else if (entity.entity_type === 'source' && onSourceNavigate) {
        onSourceNavigate(entity.id)
      }
    },
    [onTopicNavigate, onSourceNavigate]
  )

  const getEntityLabel = (entity: RelatedEntity): string => {
    return entity.name ?? entity.title ?? 'Unknown'
  }

  const getEntityIcon = (entity: RelatedEntity) => {
    return entity.entity_type === 'topic' ? (
      <BookOpen className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    )
  }

  return (
    <div className="flex flex-col">
      <TopicPanelHeader
        actions={
          <Button
            className="gap-1"
            disabled={isAdding}
            onClick={() => setShowAddDialog(true)}
            size="sm"
            variant="secondary"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        }
        label={
          <Button
            className="flex items-center gap-2 p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
          >
            <Link className="h-4 w-4" />
            <span className="font-medium text-md text-muted-foreground">
              Related ({allRelated.length})
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
            />
          </Button>
        }
      />
      {!isCollapsed && (
        <div className="flex flex-col gap-2 py-4">
          {allRelated.length === 0 && (
            <p className="py-2 text-muted-foreground text-sm">
              No related items
            </p>
          )}
          {allRelated.map((entity, index) => (
            <div
              className="flex items-center justify-between rounded-md border border-border bg-card p-3"
              key={`${entity.entity_type}-${entity.id}-${entity.direction}`}
            >
              <button
                className="flex flex-1 items-center gap-2 text-left"
                onClick={() => handleClick(entity)}
                type="button"
              >
                {getEntityIcon(entity)}
                <span className="font-medium text-sm">
                  {getEntityLabel(entity)}
                </span>
                <span className="text-muted-foreground text-xs capitalize">
                  ({entity.entity_type})
                </span>
              </button>
              <Button
                className="h-6 w-6 p-0"
                disabled={isRemoving}
                onClick={() => handleRemove(entity, entity.direction)}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddEntityRelationDialog
        isAdding={isAdding}
        onOpenChange={setShowAddDialog}
        onSelected={handleAdd}
        open={showAddDialog}
        sourceId={sourceId}
      />
    </div>
  )
}
```

**Rationale**: Follows the pattern of `SourcePrerequisitesPanel` but for entity relations.

#### 7. Create API Hooks for Source Entity Relations

**File**: `apps/web/src/features/sources/api/addSourceEntityRelation.ts` (new)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '~/lib/api-client'
import type { EntityRelationCreate } from '~/models/entity-relations.types'
import { sourceKeys } from './queryKeys'

type AddSourceEntityRelationParams = {
  sourceId: number
  data: EntityRelationCreate
}

export function useAddSourceEntityRelation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sourceId, data }: AddSourceEntityRelationParams) => {
      await api.post(`/sources/${sourceId}/entity-relations/`, data)
    },
    onSuccess: (_, { sourceId }) => {
      queryClient.invalidateQueries({ queryKey: sourceKeys.detail(sourceId) })
    },
  })
}
```

**File**: `apps/web/src/features/sources/api/removeSourceEntityRelation.ts` (new)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '~/lib/api-client'
import type { EntityType } from '~/models/entity-relations.types'
import { sourceKeys } from './queryKeys'

type RemoveSourceEntityRelationParams = {
  sourceId: number
  entityType: EntityType
  entityId: number
}

export function useRemoveSourceEntityRelation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sourceId,
      entityType,
      entityId,
    }: RemoveSourceEntityRelationParams) => {
      await api.delete(
        `/sources/${sourceId}/entity-relations/${entityType}/${entityId}/`
      )
    },
    onSuccess: (_, { sourceId }) => {
      queryClient.invalidateQueries({ queryKey: sourceKeys.detail(sourceId) })
    },
  })
}
```

**Rationale**: Mirrors the pattern of `addSourcePrerequisite` and `removeSourcePrerequisite`.

#### 8. Create AddEntityRelationDialog Component

**File**: `apps/web/src/features/sources/components/AddEntityRelationDialog.tsx` (new)

**Changes**: Create dialog for searching and adding entity relations (similar to `AddPrerequisiteDialog`).

```typescript
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/Dialog'
import { Input } from '~/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/Tabs'
import { EntityType } from '~/models/entity-relations.types'
import { useSearchTopics } from '~/features/topics/api/searchTopics'
import { useSearchSources } from '../api/searchSources'

interface AddEntityRelationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelected: (entityType: EntityType, entityId: number) => void
  isAdding: boolean
  sourceId: number | undefined
}

export function AddEntityRelationDialog({
  open,
  onOpenChange,
  onSelected,
  isAdding,
  sourceId,
}: AddEntityRelationDialogProps) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<EntityType>(EntityType.Topic)

  const { data: topics = [] } = useSearchTopics({
    query: search,
    enabled: open && activeTab === EntityType.Topic,
  })

  const { data: sources = [] } = useSearchSources({
    query: search,
    enabled: open && activeTab === EntityType.Source,
  })

  const handleSelect = (entityType: EntityType, entityId: number) => {
    onSelected(entityType, entityId)
    onOpenChange(false)
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Related Entity</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntityType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={EntityType.Topic}>Topics</TabsTrigger>
            <TabsTrigger value={EntityType.Source}>Sources</TabsTrigger>
          </TabsList>
          <Input
            className="my-4"
            placeholder={`Search ${activeTab}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <TabsContent value={EntityType.Topic}>
            <div className="max-h-60 overflow-y-auto">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  className="w-full p-2 text-left hover:bg-accent rounded"
                  onClick={() => handleSelect(EntityType.Topic, topic.id)}
                  disabled={isAdding}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value={EntityType.Source}>
            <div className="max-h-60 overflow-y-auto">
              {sources
                .filter((s) => s.id !== sourceId) // Exclude self
                .map((source) => (
                  <button
                    key={source.id}
                    className="w-full p-2 text-left hover:bg-accent rounded"
                    onClick={() => handleSelect(EntityType.Source, source.id)}
                    disabled={isAdding}
                  >
                    {source.title}
                  </button>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
```

**Rationale**: Provides UI for searching and selecting entities to relate.

#### 9. Update SourceDetail to Include SourceRelatedPanel

**File**: `apps/web/src/features/sources/components/SourceDetail/SourceDetail.tsx`

**Changes**: Import and render `SourceRelatedPanel` alongside `SourcePrerequisitesPanel`.

```typescript
import { SourceRelatedPanel } from '../SourceRelatedPanel'

// In the component, add after SourcePrerequisitesPanel:
<SourceRelatedPanel
  sourceId={source?.id}
  relatedOutgoing={source?.related_outgoing}
  relatedIncoming={source?.related_incoming}
  onTopicNavigate={handleTopicNavigate}
  onSourceNavigate={handleSourceNavigate}
/>
```

**Rationale**: Exposes the related panel in the source detail view.

#### 10. Update TopicRelatedPanel for Mixed Entity Types

**File**: `apps/web/src/features/topics/components/TopicRelatedPanel.tsx`

**Changes**: Major refactor to support both topic and source related entities.

Key changes:
1. Accept `related` prop as `Array<RelatedEntity>` instead of `Array<Topic>`
2. Display different icons/cards for topics vs sources
3. Use new entity-relations API hooks instead of legacy topic-to-topic hooks
4. Update add dialog to support adding sources

```typescript
// Props change:
interface TopicRelatedPanelProps {
  topicId: number | undefined
  related?: Array<RelatedEntity>  // Now mixed types
  // ... rest of props
}

// Render item with type distinction:
const renderItem = (entity: RelatedEntity) => {
  if (entity.entity_type === 'topic') {
    return <TopicCard topic={entity as Topic} ... />
  } else {
    return <SourceCard source={entity as Source} ... />
  }
}
```

**Rationale**: Enables showing both topics and sources in the related panel.

#### 11. Create API Hooks for Topic Entity Relations

**File**: `apps/web/src/features/topics/api/addTopicEntityRelation.ts` (new)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '~/lib/api-client'
import type { EntityRelationCreate } from '~/models/entity-relations.types'
import { topicKeys } from './queryKeys'

type AddTopicEntityRelationParams = {
  topicId: number
  data: EntityRelationCreate
}

export function useAddTopicEntityRelation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ topicId, data }: AddTopicEntityRelationParams) => {
      await api.post(`/topics/${topicId}/entity-relations/`, data)
    },
    onSuccess: (_, { topicId }) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) })
    },
  })
}
```

**File**: `apps/web/src/features/topics/api/removeTopicEntityRelation.ts` (new)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '~/lib/api-client'
import type { EntityType } from '~/models/entity-relations.types'
import { topicKeys } from './queryKeys'

type RemoveTopicEntityRelationParams = {
  topicId: number
  entityType: EntityType
  entityId: number
}

export function useRemoveTopicEntityRelation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      topicId,
      entityType,
      entityId,
    }: RemoveTopicEntityRelationParams) => {
      await api.delete(
        `/topics/${topicId}/entity-relations/${entityType}/${entityId}/`
      )
    },
    onSuccess: (_, { topicId }) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) })
    },
  })
}
```

**Rationale**: New hooks for the entity-relations endpoints.

### Success Criteria (Phase B)

#### Automated Verification:
- [ ] Command: `cd apps/web && pnpm lint` - No lint errors
- [ ] Command: `cd apps/web && pnpm build` - Build succeeds
- [ ] Command: `cd apps/web && pnpm test:ci` - All tests pass

#### Claude in Chrome E2E Testing:
After automated verification passes, manually verify:
- [ ] Topic → Source relations: add source as related from topic detail, view in panel, remove
- [ ] Source → Topic relations: add topic as related from source detail, view in panel, remove
- [ ] Source → Source relations: add source as related from source detail, view in panel, remove
- [ ] Topic detail Related panel: shows both topics and sources with type labels
- [ ] Source detail Related panel: shows both topics and sources with type labels
- [ ] Navigation: clicking related topic navigates to topic detail
- [ ] Navigation: clicking related source navigates to source detail
- [ ] Icons: topics show BookOpen icon, sources show FileText icon

---

## Summary of Files to Change

### Backend
| File | Action | Description |
|------|--------|-------------|
| `apps/api/app/schemas/sources.py` | Modify | Add `RelatedEntityRead` import and fields |
| `apps/api/app/schemas/topics.py` | Modify | Change related fields to `RelatedEntityRead` |
| `apps/api/app/sources/service.py` | Modify | Add `get_source_related_entities` function |
| `apps/api/app/sources/router.py` | Modify | Update detail endpoint to include relations |
| `apps/api/app/topics/service.py` | Modify | Add `get_topic_related_entities` function |
| `apps/api/app/topics/router.py` | Modify | Update detail endpoint to use new function |

### Frontend
| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/models/entity-relations.types.ts` | Modify | Add `RelatedEntity` type |
| `apps/web/src/features/sources/types/source.types.ts` | Modify | Add related fields |
| `apps/web/src/features/sources/types/source.schemas.ts` | Modify | Add schema validation |
| `apps/web/src/features/topics/types/topic.types.ts` | Modify | Change related fields type |
| `apps/web/src/features/topics/types/topic.schemas.ts` | Modify | Update schema validation |
| `apps/web/src/features/sources/components/SourceRelatedPanel.tsx` | Create | New related panel |
| `apps/web/src/features/sources/components/AddEntityRelationDialog.tsx` | Create | New dialog |
| `apps/web/src/features/sources/api/addSourceEntityRelation.ts` | Create | New API hook |
| `apps/web/src/features/sources/api/removeSourceEntityRelation.ts` | Create | New API hook |
| `apps/web/src/features/sources/components/SourceDetail/SourceDetail.tsx` | Modify | Add panel |
| `apps/web/src/features/topics/components/TopicRelatedPanel.tsx` | Modify | Support mixed types |
| `apps/web/src/features/topics/api/addTopicEntityRelation.ts` | Create | New API hook |
| `apps/web/src/features/topics/api/removeTopicEntityRelation.ts` | Create | New API hook |

---

## References

- Original plan: `thoughts/shared/plans/2026-01-24-practices-and-entity-relations.md`
- Backend entity relations router: `apps/api/app/sources/router.py:162-194`
- Backend entity relations schema: `apps/api/app/schemas/entity_relations.py`
- Frontend prerequisites panel: `apps/web/src/features/sources/components/SourcePrerequisitesPanel.tsx`
- Frontend topic related panel: `apps/web/src/features/topics/components/TopicRelatedPanel.tsx`
