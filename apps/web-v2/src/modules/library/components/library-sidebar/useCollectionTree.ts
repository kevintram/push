import type { Id } from '@convex/_generated/dataModel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { collectionQueries } from '../../api/collectionQueries'
import type { CollectionWithChildren } from '../../types/collection.types'
import { treeifyCollections } from '../../utils/treeifyCollections'
import type { CollectionOpenChangeHandler } from './LibraryCollectionItem'

type CollectionId = Id<'collections'>

export type CollectionTree = {
	/** Root-level collections with nested `childCollections`. */
	rootCollections: ReadonlyArray<CollectionWithChildren>
	openCollectionIds: ReadonlySet<CollectionId>
	setCollectionOpen: CollectionOpenChangeHandler
	collapseAll: () => void
}

// IDs never contain NUL, so it is a safe separator.
const KEY_SEPARATOR = '\0'

/**
 * The library tree: the user's collections as a forest, plus which of its
 * branches are open. Suspends until the collection list has loaded.
 *
 * The selected collection is the one the current route points at, if any.
 * When it changes, its ancestors are opened so it is visible. The selected
 * collection itself stays as the user left it. A manual collapse-all is not
 * undone by refetches of the same selection.
 */
export function useCollectionTree(): CollectionTree {
	const { data: collections } = useSuspenseQuery(collectionQueries.list())
	const tree = useMemo(() => treeifyCollections(collections), [collections])
	// Read loosely: this hook renders under the library layout on both the index
	// route and the `$collectionId` route, so the param may be absent.
	const { collectionId: selectedCollectionId } = useParams({
		strict: false,
	}) as { collectionId?: CollectionId }

	// Stale IDs are harmless when the reactive collection tree changes. They are
	// cleared by collapse-all, so reconciling the set against the tree is unnecessary.
	const [openCollectionIds, setOpenCollectionIds] = useState<
		ReadonlySet<CollectionId>
	>(() => new Set())

	const setCollectionOpen = useCallback(
		(collectionId: CollectionId, open: boolean) => {
			setOpenCollectionIds(previousIds => {
				if (previousIds.has(collectionId) === open) return previousIds
				const nextIds = new Set(previousIds)
				if (open) nextIds.add(collectionId)
				else nextIds.delete(collectionId)
				return nextIds
			})
		},
		[],
	)

	const collapseAll = useCallback(() => {
		setOpenCollectionIds(previousIds =>
			previousIds.size === 0 ? previousIds : new Set(),
		)
	}, [])

	// Key the effect on the *identity* of the selection, not on array references.
	// `path` gets a fresh reference on every refetch; a string key does not, so a
	// refetch after collapse-all does not reopen the branch. The selected ID is
	// part of the key so moving between siblings reopens their shared parent.
	const selected =
		selectedCollectionId === undefined
			? undefined
			: tree.nodesById.get(selectedCollectionId)
	const selectionKey = selected
		? [selected._id, ...selected.path].join(KEY_SEPARATOR)
		: null

	useEffect(() => {
		if (selectionKey === null) return
		// Round-trip through the key so the effect depends only on the key.
		// Root collections yield [] here because the key is just the selected ID.
		const [, ...ancestorIds] = selectionKey.split(
			KEY_SEPARATOR,
		) as Array<CollectionId>
		if (ancestorIds.length === 0) return

		setOpenCollectionIds(previousIds => {
			if (ancestorIds.every(id => previousIds.has(id))) return previousIds
			return new Set([...previousIds, ...ancestorIds])
		})
	}, [selectionKey])

	return {
		rootCollections: tree.roots,
		openCollectionIds,
		setCollectionOpen,
		collapseAll,
	}
}
