import type {
	Collection,
	CollectionWithChildren,
} from '../types/collection.types'

type CollectionId = Collection['_id']

// treeifyCollections converts a flat, parent-linked collection list into an ordered
// forest of collections with recursively nested children.
export function treeifyCollections(
	collections: ReadonlyArray<Collection>,
): Array<CollectionWithChildren> {
	// Build the complete lookup before linking any collections. This lets children
	// appear before their parents in the input while preserving the input order.
	const nodesById = new Map<CollectionId, CollectionWithChildren>(
		collections.map(collection => [
			collection._id,
			{ ...collection, childCollections: [] },
		]),
	)
	const cyclicIds = findCyclicIds(nodesById)
	const roots: Array<CollectionWithChildren> = []

	// Link each copied collection to its copied parent. We never mutate the documents
	// returned by Convex, so callers can safely reuse the flat collection list.
	for (const collection of collections) {
		const node = nodesById.get(collection._id)

		if (!node) continue

		// A collection on a parent cycle can never reach a root, so we drop its parent
		// edge. That keeps the cycle's collections visible and stops the recursive
		// render from looping forever.
		const parent =
			collection.parentId && !cyclicIds.has(collection._id)
				? nodesById.get(collection.parentId)
				: undefined

		if (parent) {
			parent.childCollections.push(node)
		} else {
			// Missing parents cannot form a valid edge. Keep those collections visible by
			// treating them as roots.
			roots.push(node)
		}
	}

	return roots
}

// findCyclicIds returns the ids of collections that lie on a parent cycle, including
// collections that are their own parent. Collections that merely descend from a cycle are
// left out: they still reach a rendered ancestor once the cycle is broken.
function findCyclicIds(
	nodesById: ReadonlyMap<CollectionId, CollectionWithChildren>,
): Set<CollectionId> {
	const cyclicIds = new Set<CollectionId>()
	const settledIds = new Set<CollectionId>()

	for (const startId of nodesById.keys()) {
		const path: Array<CollectionId> = []
		const pathIndexById = new Map<CollectionId, number>()
		let currentId: CollectionId | undefined = startId

		// Walk up the parent chain until it ends, rejoins an already classified
		// chain, or revisits a collection we passed on this walk.
		while (currentId && !settledIds.has(currentId)) {
			const revisitedAt = pathIndexById.get(currentId)

			if (revisitedAt !== undefined) {
				for (const id of path.slice(revisitedAt)) cyclicIds.add(id)
				break
			}

			pathIndexById.set(currentId, path.length)
			path.push(currentId)

			const parentId: CollectionId | undefined =
				nodesById.get(currentId)?.parentId
			currentId =
				parentId && nodesById.has(parentId) ? parentId : undefined
		}

		for (const id of path) settledIds.add(id)
	}

	return cyclicIds
}
