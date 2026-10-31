import type { Id } from '@convex/_generated/dataModel'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import {
	isHiddenByClosedAncestor,
	useOpenCollectionIds,
} from '~/modules/collections/hooks/useOpenCollectionIds'
import { treeifyCollections } from '~/modules/collections/utils/treeifyCollections'
import { buildCollectionResults } from '~/modules/search/utils/searchResults'

const SEARCH_DEBOUNCE_MS = 250

/** A collection, or `null` for the top level. */
type Destination = Id<'collections'> | null

type UseMoveDestinationOptions = {
	/** Left out of the tree and the results, with everything inside it. */
	excludeCollectionId?: Id<'collections'>
	initialDestination: Destination
}

export type MoveDestination = ReturnType<typeof useMoveDestination>

/**
 * The move dialog's state: the chosen destination, the collection tree and
 * its open branches, and the search that replaces the tree while there is a
 * query.
 *
 * The tree opens to the initial destination once the collection list loads,
 * and to a result chosen while searching once the query is cleared, since it
 * may sit in a closed branch.
 */
export function useMoveDestination({
	excludeCollectionId,
	initialDestination,
}: UseMoveDestinationOptions) {
	const [selectedDestination, setSelectedDestination] =
		useState<Destination>(initialDestination)
	const [query, setQuery] = useState('')

	const collectionsQuery = useQuery(collectionQueries.list())
	const { data: collections } = collectionsQuery
	// Leaves the moved collection and everything inside it out of the tree,
	// and so out of the results, which keep only hits found in the tree.
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

	const {
		openCollectionIds,
		setCollectionOpen,
		openCollections,
		collapseAll,
	} = useOpenCollectionIds(() => new Set())

	const selected =
		selectedDestination === null
			? undefined
			: tree.nodesById.get(selectedDestination)

	const revealSelection = useCallback(() => {
		if (selected) openCollections(selected.path)
	}, [selected, openCollections])

	// Opens the initial destination's branch during the render that first has
	// the list, so the dialog never paints it closed.
	const [hasRevealedInitial, setHasRevealedInitial] = useState(false)
	if (collections !== undefined && !hasRevealedInitial) {
		setHasRevealedInitial(true)
		revealSelection()
	}

	const hiddenSelection =
		selected &&
		isHiddenByClosedAncestor(selected, tree.nodesById, openCollectionIds)
			? selected
			: undefined

	const trimmedQuery = query.trim()
	const debouncedQuery = useDebouncedValue(trimmedQuery, SEARCH_DEBOUNCE_MS)
	const searchQuery = useQuery({
		...collectionQueries.search(debouncedQuery),
		enabled: debouncedQuery !== '',
		// Keeps the last results on screen while the next query loads, so a
		// click aimed at one doesn't land on a loading message.
		placeholderData: keepPreviousData,
	})
	const { data: hits } = searchQuery
	const results = useMemo(
		() =>
			buildCollectionResults(
				(hits ?? []).filter(hit => tree.nodesById.has(hit._id)),
			),
		[hits, tree],
	)

	// Set when a result is chosen, so clearing the query reveals that choice
	// without undoing a collapse-all when nothing was chosen.
	const [revealOnClear, setRevealOnClear] = useState(false)

	const handleSelect = useCallback(
		(destination: Destination) => {
			setSelectedDestination(destination)
			if (trimmedQuery !== '') setRevealOnClear(true)
		},
		[trimmedQuery],
	)

	const handleQueryChange = useCallback(
		(nextQuery: string) => {
			setQuery(nextQuery)
			if (nextQuery.trim() === '' && revealOnClear) {
				setRevealOnClear(false)
				revealSelection()
			}
		},
		[revealOnClear, revealSelection],
	)

	return {
		collections: {
			isError: collectionsQuery.isError,
			isPending: collectionsQuery.isPending,
			roots: tree.roots,
		},
		hiddenSelection,
		openCollectionIds,
		setCollectionOpen,
		collapseAll,
		revealSelection,
		query,
		setQuery: handleQueryChange,
		isSearching: trimmedQuery !== '',
		search: {
			isError: searchQuery.isError || collectionsQuery.isError,
			// Results wait for the tree, which decides which hits to keep.
			isLoading: hits === undefined || collections === undefined,
			results,
		},
		selectedDestination,
		setSelectedDestination: handleSelect,
	}
}
