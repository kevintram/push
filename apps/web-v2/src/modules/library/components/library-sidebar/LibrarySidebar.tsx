import type { Id } from '@convex/_generated/dataModel'
import { DragDropProvider } from '@dnd-kit/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
	collectionQueries,
	useUpdateCollection,
} from '../../api/collectionQueries'
import { treeifyCollections } from '../../utils/treeifyCollections'
import { LibrarySidebarContent } from './LibrarySidebarContent'

/**
 * Owns collection data and the drag-and-drop provider boundary. The content
 * remains a child so its droppable hook runs beneath this provider.
 */
export function LibrarySidebar() {
	const { data: collections } = useSuspenseQuery(collectionQueries.list())
	const collectionTree = useMemo(
		() => treeifyCollections(collections),
		[collections],
	)
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
			<LibrarySidebarContent collections={collectionTree} />
		</DragDropProvider>
	)
}
