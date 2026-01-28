# Topic Add Sources UI - Implementation Plan

## Overview

Add missing UI functionality to allow adding sources from the Topic detail view:
1. **TopicRelatedPanel**: Add ability to search and add sources as related entities
2. **TopicSourcesPanel**: Add ability to search and add sources that cover the topic

Both features have working backend APIs and frontend hooks - only the UI is missing.

## Current State Analysis

### TopicRelatedPanel (`apps/web/src/features/topics/components/TopicRelatedPanel.tsx`)
- **Lines 202-212**: Dropdown menu only shows "Create New Topic" and "Search Topics"
- **Lines 114-126**: `handleAddTopic` hardcodes `EntityType.Topic`
- Uses `AddRelationshipDialog` which only searches topics
- Backend API works: `POST /topics/{id}/entity-relations/` accepts sources
- Frontend hooks exist: `useAddTopicEntityRelation`, `useRemoveTopicEntityRelation`

### TopicSourcesPanel (`apps/web/src/features/topics/components/TopicSourcesPanel.tsx`)
- Read-only display of sources that cover the topic
- No "Add" button or dialog
- `LearnablePanel` supports `actions` prop but none passed
- Backend API works: `POST /sources/{sourceId}/topics/` with `{ topic_id }`
- Frontend hook exists: `useAddSourceTopic()` (in sources feature)

### Existing Pattern: AddPrerequisiteDialog (`apps/web/src/features/sources/components/AddPrerequisiteDialog.tsx`)
- Tab-based UI to search topics OR sources
- Props: `sourceId`, `onSelected(entityType, entityId)`, `open`, `onOpenChange`
- Filters out current source from source results (line 58-61)
- Used by `SourceRelatedPanel` and `SourcePrerequisitesPanel`

## Desired End State

After implementation:
- Topic detail page Related panel has "Search Sources" option in dropdown
- Topic detail page Sources panel has "Add" button to search and add sources
- Both use consistent dialog patterns matching the rest of the codebase

## What We're NOT Doing

- **No backend changes** - APIs already work
- **No new hooks for entity relations** - Existing hooks support both entity types
- **No changes to how relations are displayed** - Only adding "Add" functionality

## Implementation Approach

Reuse `AddPrerequisiteDialog` for TopicRelatedPanel by making it more flexible (add `topicId` prop). Create a new sources-only search dialog for TopicSourcesPanel following the `AddTopicToSourceDialog` pattern.

---

## Phase 1: TopicRelatedPanel - Add Sources as Related

### Overview
Update TopicRelatedPanel to allow searching and adding sources as related entities by reusing `AddPrerequisiteDialog`.

### Changes Required

#### 1. Update AddPrerequisiteDialog to Support Topic Context

**File**: `apps/web/src/features/sources/components/AddPrerequisiteDialog.tsx`

**Changes**: Add optional `topicId` prop to filter current topic from topic search results.

```typescript
interface AddPrerequisiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceId?: number | undefined  // Make optional
  topicId?: number | undefined   // Add new prop
  onSelected?: (entityType: EntityType, entityId: number) => void
  isAdding?: boolean
}
```

**Update filtering logic** (around line 58):

```typescript
// Filter out the current source from source results
const filteredSourceResults = useMemo(
  () => sourceResults.filter(s => s.id !== sourceId),
  [sourceResults, sourceId]
)

// Filter out the current topic from topic results
const filteredTopicResults = useMemo(
  () => topicResults.filter(t => t.id !== topicId),
  [topicResults, topicId]
)
```

**Update results variable** (around line 146):

```typescript
const results = searchType === 'topic' ? filteredTopicResults : filteredSourceResults
```

**Rationale**: Minimal change to existing dialog. Both `sourceId` and `topicId` become optional - when provided, the corresponding entity type filters out that ID.

#### 2. Update TopicRelatedPanel Dropdown Menu

**File**: `apps/web/src/features/topics/components/TopicRelatedPanel.tsx`

**Changes**: Add "Search Sources" option to dropdown menu.

Replace lines 202-212:

```typescript
<DropdownMenuContent align='start'>
  <DropdownMenuItem onClick={() => setShowAddTopicDialog(true)}>
    <SquarePen className='h-4 w-4' />
    Create New Topic
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
    <Search className='h-4 w-4' />
    Search Topics
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setShowAddEntityDialog(true)}>
    <Search className='h-4 w-4' />
    Search Sources
  </DropdownMenuItem>
</DropdownMenuContent>
```

**Rationale**: Adds a third option specifically for searching sources.

#### 3. Add State and Handler for Entity Dialog

**File**: `apps/web/src/features/topics/components/TopicRelatedPanel.tsx`

**Changes**: Add state for the new dialog and a handler that supports both entity types.

Add import at top:

```typescript
import { AddPrerequisiteDialog } from '~/features/sources/components/AddPrerequisiteDialog'
```

Add state (around line 69):

```typescript
const [showAddEntityDialog, setShowAddEntityDialog] = useState(false)
```

Add handler (after `handleAddTopic`):

```typescript
// Handle adding any entity type (from AddPrerequisiteDialog)
const handleAddEntity = useCallback(
  async (entityType: EntityType, entityId: number) => {
    if (!topicId) return
    await addRelation.mutateAsync({
      topicId,
      data: {
        to_entity_type: entityType,
        to_entity_id: entityId
      }
    })
  },
  [topicId, addRelation]
)
```

**Rationale**: The new handler accepts `EntityType` from the dialog, allowing it to add both topics and sources.

#### 4. Add AddPrerequisiteDialog to TopicRelatedPanel

**File**: `apps/web/src/features/topics/components/TopicRelatedPanel.tsx`

**Changes**: Render the dialog after the existing dialogs (around line 280).

```typescript
<AddPrerequisiteDialog
  isAdding={isCreating}
  onOpenChange={setShowAddEntityDialog}
  onSelected={handleAddEntity}
  open={showAddEntityDialog}
  topicId={topicId}
/>
```

**Rationale**: Uses the updated dialog with `topicId` to filter out the current topic from search results.

### Success Criteria (Phase 1)

#### Automated Verification:
- [x] Command: `cd apps/web && pnpm lint` - No lint errors
- [x] Command: `cd apps/web && pnpm build` - Build succeeds

#### Manual Verification:
- [x] Topic detail page → Related panel → Add dropdown shows "Search Sources" option
- [x] Clicking "Search Sources" opens dialog with Topics/Sources tabs
- [x] Searching sources shows results (excluding unrelated sources)
- [x] Selecting a source creates the relation and closes dialog
- [x] The source appears in the Related panel with source icon
- [x] Existing "Search Topics" and "Create New Topic" still work

---

## Phase 2: TopicSourcesPanel - Add Sources That Cover Topic

### Overview
Add an "Add" action to TopicSourcesPanel to search and add sources that cover the topic.

### Changes Required

#### 1. Create AddSourceToTopicDialog Component

**File**: `apps/web/src/features/topics/components/AddSourceToTopicDialog.tsx` (new)

**Changes**: Create a sources-only search dialog following the `AddTopicToSourceDialog` pattern.

```typescript
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MIN_HEIGHT } from '~/components/search/constants'
import { SearchInput } from '~/components/search/SearchInput'
import { SearchResultsContainer } from '~/components/search/SearchResultsContainer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '~/components/ui/Dialog'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { SourceCard } from '~/features/sources/components/SourceCard'
import { useSearchSources } from '~/features/sources/api/searchSources'
import type { Source } from '~/features/sources/types/source.types'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'

interface AddSourceToTopicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingSourceIds?: Array<number>
  onSelected?: (source: Source) => void
  isCreating?: boolean
}

export function AddSourceToTopicDialog({
  open,
  onOpenChange,
  existingSourceIds = [],
  onSelected,
  isCreating = false
}: AddSourceToTopicDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)

  const { data: sourceResults = [], isLoading } = useSearchSources({
    query: debouncedQuery || undefined,
    enabled: open
  })

  // Filter out sources already covering this topic
  const filteredResults = useMemo(
    () => sourceResults.filter(s => !existingSourceIds.includes(s.id)),
    [sourceResults, existingSourceIds]
  )

  useEffect(() => {
    if (open) {
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [open])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value)
    },
    []
  )

  const handleClear = useCallback(() => {
    setQuery('')
  }, [])

  const handleSourceSelected = useCallback(
    (source: Source) => {
      onSelected?.(source)
      onOpenChange(false)
    },
    [onSelected, onOpenChange]
  )

  const renderItem = useCallback(
    (source: Source) => (
      <SourceCard
        headerRight={<SourceActionMenu source={source} />}
        minHeight={MIN_HEIGHT}
        onSourceClick={() => handleSourceSelected(source)}
        searchQuery={debouncedQuery}
        source={source}
      />
    ),
    [handleSourceSelected, debouncedQuery]
  )

  const estimateItemSize = useCallback((source: Source) => {
    const titleLines = Math.ceil((source.title?.length || 8) / 40)
    const notesLines = source.notes
      ? Math.min(2, Math.ceil(source.notes.length / 40))
      : 0
    return Math.max(MIN_HEIGHT, 80 + (titleLines - 1) * 20 + notesLines * 20)
  }, [])

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[90vh] w-full max-w-[90vw] flex-col p-0 md:h-[600px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px]'
        showCloseButton={false}
      >
        <DialogHeader className='flex-shrink-0 px-3 pt-3 md:px-4 md:pt-4'>
          <DialogTitle className='sr-only'>Add Source</DialogTitle>
          <SearchInput
            inputRef={inputRef}
            onChange={handleSearchChange}
            onClear={handleClear}
            placeholder='Search sources...'
            value={query}
          />
        </DialogHeader>

        <div className='scrollbar-track-transparent flex-1 overflow-y-auto p-3 pt-0 md:p-4'>
          <SearchResultsContainer
            animate={false}
            estimateItemSize={estimateItemSize}
            getItemKey={(source: Source) => source.id}
            hasQuery={Boolean(debouncedQuery.trim())}
            isLoading={isLoading}
            renderItem={renderItem}
            results={filteredResults}
            searchQuery={query}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Rationale**: Follows the exact pattern of `AddTopicToSourceDialog` but for sources. Filters out sources that already cover the topic via `existingSourceIds`.

#### 2. Create useAddTopicSource Hook

**File**: `apps/web/src/features/topics/api/addTopicSource.ts` (new)

**Changes**: Create a wrapper hook that calls the source-topic API from the topic side.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { addSourceTopic } from '~/features/sources/api/addSourceTopic'
import { topicKeys } from './queryKeys'

type AddTopicSourceParams = {
  topicId: number
  sourceId: number
}

export function useAddTopicSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ topicId, sourceId }: AddTopicSourceParams) => {
      // The API is on the source side: POST /sources/{sourceId}/topics/
      return addSourceTopic(sourceId, { topic_id: topicId })
    },
    onSuccess: async (_, variables) => {
      // Invalidate both the topic and source detail queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: topicKeys.detail(variables.topicId)
        }),
        queryClient.invalidateQueries({
          queryKey: sourceKeys.detail(variables.sourceId)
        })
      ])
    }
  })
}
```

**Rationale**: Provides a topic-centric API even though the underlying endpoint is on the source side. Invalidates both queries for consistency.

#### 3. Update TopicSourcesPanel to Add Sources

**File**: `apps/web/src/features/topics/components/TopicSourcesPanel.tsx`

**Changes**: Add state, hooks, and "Add" action to the panel.

Add imports:

```typescript
import { ChevronDown, Loader2, Plus, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useAddTopicSource } from '../api/addTopicSource'
import { AddSourceToTopicDialog } from './AddSourceToTopicDialog'
```

Update props interface:

```typescript
interface TopicSourcesPanelProps {
  topicId?: number  // Add this prop
  sources?: Array<Source>
  getScrollElement?: () => HTMLDivElement | null
  scrollMargin?: number
  onSourceSelect?: (sourceId: number) => void
  renderCard?: (source: Source, onClick: () => void) => ReactNode
}
```

Add state and hooks inside component:

```typescript
const [showAddDialog, setShowAddDialog] = useState(false)
const addSourceMutation = useAddTopicSource()
const isAdding = addSourceMutation.isPending

// Get existing source IDs to filter from search
const existingSourceIds = useMemo(
  () => sources.map(s => s.id),
  [sources]
)

const handleAddSource = useCallback(
  async (source: Source) => {
    if (!topicId) return
    await addSourceMutation.mutateAsync({
      topicId,
      sourceId: source.id
    })
  },
  [topicId, addSourceMutation]
)
```

Create actions element:

```typescript
const actions = topicId ? (
  <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild={true} disabled={isAdding}>
        <Button className='gap-1' size='sm' variant='secondary'>
          {isAdding ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Plus className='h-4 w-4' />
          )}
          Add
          <ChevronDown className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
          <Search className='h-4 w-4' />
          Search Sources
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <AddSourceToTopicDialog
      existingSourceIds={existingSourceIds}
      isCreating={isAdding}
      onOpenChange={setShowAddDialog}
      onSelected={handleAddSource}
      open={showAddDialog}
    />
  </>
) : undefined
```

Update LearnablePanel to pass actions:

```typescript
return (
  <LearnablePanel
    actions={actions}  // Add this prop
    estimateItemSize={estimateItemSize}
    // ... rest of props
  />
)
```

**Rationale**: Follows the exact pattern of `SourceTopicsPanel` but inverted for topics.

#### 4. Update TopicDetail to Pass topicId to TopicSourcesPanel

**File**: `apps/web/src/features/topics/components/TopicDetail/TopicDetail.tsx`

**Changes**: Pass `topicId` prop to `TopicSourcesPanel` (around line 277).

```typescript
<TopicSourcesPanel
  getScrollElement={() => scrollContainerRef.current}
  onSourceSelect={onSourceNavigate}
  renderCard={renderSourceCard}
  sources={topic.sources}
  topicId={topic.id}  // Add this prop
/>
```

**Rationale**: The panel needs the topic ID to create the source-topic relationship.

### Success Criteria (Phase 2)

#### Automated Verification:
- [x] Command: `cd apps/web && pnpm lint` - No lint errors
- [x] Command: `cd apps/web && pnpm build` - Build succeeds

#### Manual Verification:
- [x] Topic detail page → Sources panel shows "Add" dropdown button
- [x] Clicking "Search Sources" opens search dialog
- [x] Searching shows source results
- [x] Sources already covering the topic are filtered out
- [x] Selecting a source adds it and closes dialog
- [x] The source appears in the Sources panel
- [x] Source detail page also shows the topic in its Topics panel

---

## Summary of Files to Change

### Phase 1
| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/features/sources/components/AddPrerequisiteDialog.tsx` | Modify | Add optional `topicId` prop and filter logic |
| `apps/web/src/features/topics/components/TopicRelatedPanel.tsx` | Modify | Add "Search Sources" option, state, handler, and dialog |

### Phase 2
| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/features/topics/components/AddSourceToTopicDialog.tsx` | Create | Sources-only search dialog |
| `apps/web/src/features/topics/api/addTopicSource.ts` | Create | Hook wrapper for adding sources from topic side |
| `apps/web/src/features/topics/components/TopicSourcesPanel.tsx` | Modify | Add state, hooks, and "Add" action |
| `apps/web/src/features/topics/components/TopicDetail/TopicDetail.tsx` | Modify | Pass `topicId` to TopicSourcesPanel |

---

## E2E Testing with Claude in Chrome

### Prerequisites

Before running E2E tests, start both the API and web dev servers.

#### 1. Start the API Server (Background Process)

Run the API server in the background so it doesn't block your terminal:

```bash
cd apps/api && uv run fastapi dev --host localhost &
```

Or use the Bash tool with `run_in_background: true` to start it as a background task.

**Verify API is running:**
```bash
curl http://localhost:8000/health
```

#### 2. Start the Web Dev Server

```bash
cd apps/web && pnpm dev
```

The web app will be available at `http://localhost:5173`.

### E2E Test Checklist

After each phase, perform the following manual verification using Claude in Chrome:

#### Phase 1: TopicRelatedPanel Tests

1. **Navigate to a topic detail page**
   - Go to `http://localhost:5173/topics/{topicId}` (use an existing topic)

2. **Test "Search Sources" option**
   - Locate the Related panel
   - Click the "Add" dropdown button
   - Verify "Search Sources" option appears alongside "Create New Topic" and "Search Topics"
   - Click "Search Sources"

3. **Test source search dialog**
   - Verify dialog opens with Topics/Sources tabs
   - Click "Sources" tab
   - Type a search query
   - Verify source results appear
   - Verify the current topic is NOT shown in topic results (when on Topics tab)

4. **Test adding a source as related**
   - Select a source from the results
   - Verify dialog closes
   - Verify the source now appears in the Related panel with a source icon (FileText)
   - Verify the relation persists after page refresh

5. **Test existing functionality still works**
   - Click "Add" → "Search Topics" - verify it still works
   - Click "Add" → "Create New Topic" - verify it still works

#### Phase 2: TopicSourcesPanel Tests

1. **Navigate to a topic detail page**
   - Go to `http://localhost:5173/topics/{topicId}`

2. **Locate the Sources panel**
   - Scroll down to find the "Sources" panel (shows sources that cover this topic)
   - Verify an "Add" dropdown button now appears in the panel header

3. **Test source search dialog**
   - Click the "Add" dropdown
   - Click "Search Sources"
   - Verify dialog opens with source search
   - Type a search query
   - Verify results appear
   - Verify sources already covering this topic are filtered out

4. **Test adding a source**
   - Select a source from the results
   - Verify dialog closes
   - Verify the source now appears in the Sources panel
   - Verify the relation persists after page refresh

5. **Test bidirectional relationship**
   - Navigate to the source detail page (`/sources/{sourceId}`)
   - Verify the topic appears in the source's Topics panel

### Cleanup

After testing, stop the background API server:

```bash
# Find the process
ps aux | grep fastapi

# Kill it
kill <PID>
```

Or if started via Claude Code background task, use the TaskStop tool.

---

## References

- Original plan: `thoughts/shared/plans/2026-01-25-phase-4-remaining-e2e-tests.md`
- Pattern reference: `apps/web/src/features/sources/components/AddPrerequisiteDialog.tsx`
- Pattern reference: `apps/web/src/features/sources/components/SourceTopicsPanel.tsx`
- Entity relations hooks: `apps/web/src/features/topics/api/addTopicEntityRelation.ts`
