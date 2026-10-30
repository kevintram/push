import type { Id } from '@convex/_generated/dataModel'
import { useCallback, useState } from 'react'

import type { Collection } from '../types/collection.types'

type CollectionId = Id<'collections'>

export type OpenCollectionIds = {
	openCollectionIds: ReadonlySet<CollectionId>
	setCollectionOpen: (collectionId: CollectionId, open: boolean) => void
	/** Opens every given branch, leaving the rest as they are. */
	openCollections: (collectionIds: ReadonlyArray<CollectionId>) => void
	collapseAll: () => void
}

/**
 * Which branches of a collection tree are open. Updates that change nothing
 * keep the same set, so consumers can depend on its identity.
 */
export function useOpenCollectionIds(
	initialOpenIds: () => ReadonlySet<CollectionId>,
): OpenCollectionIds {
	const [openCollectionIds, setOpenCollectionIds] =
		useState<ReadonlySet<CollectionId>>(initialOpenIds)

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

	const openCollections = useCallback(
		(collectionIds: ReadonlyArray<CollectionId>) => {
			setOpenCollectionIds(previousIds => {
				if (collectionIds.every(id => previousIds.has(id))) {
					return previousIds
				}
				return new Set([...previousIds, ...collectionIds])
			})
		},
		[],
	)

	const collapseAll = useCallback(() => {
		setOpenCollectionIds(previousIds =>
			previousIds.size === 0 ? previousIds : new Set(),
		)
	}, [])

	return {
		openCollectionIds,
		setCollectionOpen,
		openCollections,
		collapseAll,
	}
}

/**
 * Whether a closed ancestor hides the collection in the tree. An ancestor
 * missing from the tree is not rendered, so it cannot hide anything.
 */
export function isHiddenByClosedAncestor(
	collection: Pick<Collection, 'path'>,
	nodesById: ReadonlyMap<CollectionId, unknown>,
	openCollectionIds: ReadonlySet<CollectionId>,
): boolean {
	return collection.path.some(
		id => nodesById.has(id) && !openCollectionIds.has(id),
	)
}
