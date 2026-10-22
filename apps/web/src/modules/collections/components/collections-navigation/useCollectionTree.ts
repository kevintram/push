import type { Id } from '@convex/_generated/dataModel'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { readStoredStringArray, writeStoredValue } from '~/utils/storage'

import { collectionQueries } from '../../api/collectionQueries'
import type { CollectionWithChildren } from '../../types/collection.types'
import { treeifyCollections } from '../../utils/treeifyCollections'
import type { CollectionOpenChangeHandler } from './CollectionTreeItem'

type CollectionId = Id<'collections'>

export type CollectionTree = {
	/** Root-level collections with nested `childCollections`. */
	rootCollections: ReadonlyArray<CollectionWithChildren>
	openCollectionIds: ReadonlySet<CollectionId>
	setCollectionOpen: CollectionOpenChangeHandler
	collapseAll: () => void
	/** The selected collection while a collapsed ancestor hides it in the tree. */
	hiddenSelection: CollectionWithChildren | undefined
	/** Opens the selected collection and its ancestors. */
	revealSelection: () => void
}

// IDs never contain NUL, so it is a safe separator.
const KEY_SEPARATOR = '\0'
const OPEN_COLLECTIONS_STORAGE_KEY = 'collectionsNavigationOpenIds'

function readStoredOpenCollectionIds(): ReadonlySet<CollectionId> {
	return new Set(
		readStoredStringArray(
			OPEN_COLLECTIONS_STORAGE_KEY,
		) as Array<CollectionId>,
	)
}

/**
 * The collection tree: the user's collections as a forest, plus which of its
 * branches are open. It stays empty while the collection list loads so the
 * persistent app sidebar never blocks the current route.
 *
 * The selected collection is the one the current route points at, if any.
 * When it changes, it and its ancestors are opened, so it is visible and its
 * children are revealed. A manual collapse-all is not undone by refetches of
 * the same selection, but the selection is reported as hidden until
 * `revealSelection` opens its branch again.
 *
 * The open branches are saved to local storage, so they survive reloads and
 * the sidebar unmounting this tree when it collapses.
 */
export function useCollectionTree(): CollectionTree {
	// `AppShell` keeps this query subscribed while the sidebar is collapsed, so
	// the list is usually cached by the time the tree mounts. Keep the shell
	// usable while a cold load is still in flight.
	// TODO(2): Handle query errors so a failed request isn't shown as an empty tree.
	const { data } = useQuery(collectionQueries.list())
	// A query error keeps the last data, so check for data, not success.
	const isLoaded = data !== undefined
	const tree = useMemo(() => treeifyCollections(data ?? []), [data])
	// Read loosely because most routes do not define a collectionId param.
	const { collectionId: selectedCollectionId } = useParams({
		strict: false,
	}) as { collectionId?: CollectionId }

	// May name collections missing from the tree, such as ones deleted here or
	// on another device. `openCollectionIds` leaves those out.
	const [unfilteredOpenIds, setOpenCollectionIds] = useState<
		ReadonlySet<CollectionId>
	>(readStoredOpenCollectionIds)

	// Unfiltered until the list loads: the tree is empty until then, and
	// filtering would discard every saved branch.
	const openCollectionIds = useMemo(() => {
		if (!isLoaded) return unfilteredOpenIds
		const ids = [...unfilteredOpenIds].filter(id => tree.nodesById.has(id))
		return ids.length === unfilteredOpenIds.size
			? unfilteredOpenIds
			: new Set(ids)
	}, [isLoaded, unfilteredOpenIds, tree])

	// Serialized so a refetch that leaves the set unchanged does not write.
	const serializedOpenIds = isLoaded
		? JSON.stringify([...openCollectionIds])
		: null

	useEffect(() => {
		if (serializedOpenIds === null) return
		writeStoredValue(OPEN_COLLECTIONS_STORAGE_KEY, serializedOpenIds)
	}, [serializedOpenIds])

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

	// Key the effect on the *identity* of the selection, not on array references.
	// `path` gets a fresh reference on every refetch; a string key does not, so a
	// refetch after collapse-all does not reopen the branch. The selected ID is
	// part of the key so moving between siblings reopens their shared parent.
	const selected =
		selectedCollectionId === undefined
			? undefined
			: tree.nodesById.get(selectedCollectionId)
	// Ancestors first, root first, then the selection itself, so the key both
	// identifies the selection and lists every branch to open, outside-in.
	const selectionKey = selected
		? [...selected.path, selected._id].join(KEY_SEPARATOR)
		: null

	// Round-trip through the key so the effect depends only on the key.
	const revealSelection = useCallback(() => {
		if (selectionKey === null) return
		openCollections(
			selectionKey.split(KEY_SEPARATOR) as Array<CollectionId>,
		)
	}, [selectionKey, openCollections])

	useEffect(() => revealSelection(), [revealSelection])

	// An ancestor missing from the list is not rendered, so it cannot hide the
	// selection.
	const hiddenSelection = selected?.path.some(
		id => tree.nodesById.has(id) && !openCollectionIds.has(id),
	)
		? selected
		: undefined

	return {
		rootCollections: tree.roots,
		openCollectionIds,
		setCollectionOpen,
		collapseAll,
		hiddenSelection,
		revealSelection,
	}
}
