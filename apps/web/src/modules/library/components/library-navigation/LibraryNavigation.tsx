import type { Id } from '@convex/_generated/dataModel'
import { DragDropProvider } from '@dnd-kit/react'

import { useUpdateCollection } from '../../api/collectionQueries'
import { LibraryNavigationContent } from './LibraryNavigationContent'
import { useCollectionTree } from './useCollectionTree'

/**
 * Owns the library tree and the drag-and-drop provider boundary. The content
 * remains a child so its droppable hook runs beneath this provider.
 */
export function LibraryNavigation() {
	const {
		rootCollections,
		openCollectionIds,
		setCollectionOpen,
		collapseAll,
		selectedCollection,
		isSelectionCollapsed,
		revealSelection,
	} = useCollectionTree()
	const updateCollection = useUpdateCollection()

	return (
		<DragDropProvider
			onDragEnd={event => {
				if (event.canceled) return

				const { source, target } = event.operation

				if (
					source?.id === undefined ||
					target?.id === undefined ||
					source?.id === target?.id
				) {
					return
				}

				if (target.id === 'library-root') {
					updateCollection.mutate({
						collectionId: source.id as Id<'collections'>,
						parentId: null,
					})
				} else {
					updateCollection.mutate({
						collectionId: source.id as Id<'collections'>,
						parentId: target.id as Id<'collections'>,
					})
				}
			}}
		>
			<LibraryNavigationContent
				collections={rootCollections}
				openCollectionIds={openCollectionIds}
				onCollectionOpenChange={setCollectionOpen}
				onCollapseAll={collapseAll}
				selectedCollection={selectedCollection}
				isSelectionCollapsed={isSelectionCollapsed}
				onRevealSelection={revealSelection}
			/>
		</DragDropProvider>
	)
}
