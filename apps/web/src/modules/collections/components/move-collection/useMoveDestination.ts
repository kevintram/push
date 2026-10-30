import type { Id } from '@convex/_generated/dataModel'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import { useOpenCollectionIds } from '~/modules/collections/hooks/useOpenCollectionIds'
import { treeifyCollections } from '~/modules/collections/utils/treeifyCollections'

/** A collection, or `null` for the top level. */
type Destination = Id<'collections'> | null

type UseMoveDestinationOptions = {
	/** Left out of the tree, with everything inside it. */
	excludeCollectionId?: Id<'collections'>
	initialDestination: Destination
}

export type MoveDestination = ReturnType<typeof useMoveDestination>

/**
 * The move dialog's state: the chosen destination, and the collection tree
 * and its open branches.
 *
 * The tree opens to the initial destination once the collection list loads.
 */
export function useMoveDestination({
	excludeCollectionId,
	initialDestination,
}: UseMoveDestinationOptions) {
	const [selectedDestination, setSelectedDestination] =
		useState<Destination>(initialDestination)

	const collectionsQuery = useQuery(collectionQueries.list())
	const { data: collections } = collectionsQuery
	// Leaves the moved collection and everything inside it out of the tree.
	const tree = useMemo(
		() =>
			treeifyCollections(
				(collections ?? []).filter(
					collection =>
						!excludeCollectionId ||
						(collection._id !== excludeCollectionId &&
							!collection.path.includes(excludeCollectionId)),
				),
			),
		[collections, excludeCollectionId],
	)

	const { openCollectionIds, setCollectionOpen, openCollections } =
		useOpenCollectionIds(() => new Set())

	const selected =
		selectedDestination === null
			? undefined
			: tree.nodesById.get(selectedDestination)

	// Opens the initial destination's branch during the render that first has
	// the list, so the dialog never paints it closed.
	const [hasRevealedInitial, setHasRevealedInitial] = useState(false)
	if (collections !== undefined && !hasRevealedInitial) {
		setHasRevealedInitial(true)
		if (selected) openCollections(selected.path)
	}

	return {
		collections: {
			isError: collectionsQuery.isError,
			isPending: collectionsQuery.isPending,
			roots: tree.roots,
		},
		openCollectionIds,
		setCollectionOpen,
		selectedDestination,
		setSelectedDestination,
	}
}
