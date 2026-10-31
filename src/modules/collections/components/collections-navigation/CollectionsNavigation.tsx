import type { Id } from '@convex/_generated/dataModel'
import { DragDropProvider } from '@dnd-kit/react'
import { use, useRef } from 'react'

import { PopoverHoldContext } from '~/components/ui'

import { useMoveCollection } from '../../api/collectionQueries'
import { CollectionDragOverlay } from './CollectionDragOverlay'
import { CollectionsNavigationContent } from './CollectionsNavigationContent'
import type { CollectionDragData } from './CollectionTreeItem'
import { useCollectionTree } from './useCollectionTree'

/**
 * Owns the collection tree and the drag-and-drop provider boundary. The content
 * remains a child so its droppable hook runs beneath this provider.
 */
export function CollectionsNavigation() {
	const {
		rootCollections,
		openCollectionIds,
		setCollectionOpen,
		collapseAll,
		hiddenSelection,
		revealSelection,
	} = useCollectionTree()
	const moveCollection = useMoveCollection()
	// Dragging reads as leaving an enclosing hover popover, so the drag holds
	// it open. Held on drag start rather than in an effect, before the next
	// pointer move can close it.
	const holdPopoverOpen = use(PopoverHoldContext)
	const releasePopover = useRef<(() => void) | undefined>(undefined)

	return (
		<DragDropProvider
			onDragStart={() => {
				releasePopover.current = holdPopoverOpen?.()
			}}
			onDragEnd={event => {
				releasePopover.current?.()
				releasePopover.current = undefined
				if (event.canceled) return

				const { source, target } = event.operation

				if (
					source?.id === undefined ||
					target?.id === undefined ||
					source?.id === target?.id
				) {
					return
				}

				const { parentId } = source.data as CollectionDragData
				moveCollection.mutate({
					collectionId: source.id as Id<'collections'>,
					parentId:
						target.id === 'collections-root'
							? null
							: (target.id as Id<'collections'>),
					fromParentId: parentId ?? null,
				})
			}}
		>
			<CollectionsNavigationContent
				collections={rootCollections}
				openCollectionIds={openCollectionIds}
				onCollectionOpenChange={setCollectionOpen}
				onCollapseAll={collapseAll}
				hiddenSelection={hiddenSelection}
				onRevealSelection={revealSelection}
			/>
			<CollectionDragOverlay />
		</DragDropProvider>
	)
}
