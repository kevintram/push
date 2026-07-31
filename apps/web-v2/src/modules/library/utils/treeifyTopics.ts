import type { Topic, TopicWithChildren } from '../types/topic.types'

type TopicId = Topic['_id']

// treeifyTopics converts a flat, parent-linked topic list into an ordered
// forest of topics with recursively nested children.
export function treeifyTopics(
	topics: ReadonlyArray<Topic>,
): Array<TopicWithChildren> {
	// Build the complete lookup before linking any topics. This lets children
	// appear before their parents in the input while preserving the input order.
	const nodesById = new Map<TopicId, TopicWithChildren>(
		topics.map(topic => [topic._id, { ...topic, childTopics: [] }]),
	)
	const cyclicIds = findCyclicIds(nodesById)
	const roots: Array<TopicWithChildren> = []

	// Link each copied topic to its copied parent. We never mutate the documents
	// returned by Convex, so callers can safely reuse the flat topic list.
	for (const topic of topics) {
		const node = nodesById.get(topic._id)

		if (!node) continue

		// A topic on a parent cycle can never reach a root, so we drop its parent
		// edge. That keeps the cycle's topics visible and stops the recursive
		// render from looping forever.
		const parent =
			topic.parentId && !cyclicIds.has(topic._id)
				? nodesById.get(topic.parentId)
				: undefined

		if (parent) {
			parent.childTopics.push(node)
		} else {
			// Missing parents cannot form a valid edge. Keep those topics visible by
			// treating them as roots.
			roots.push(node)
		}
	}

	return roots
}

// findCyclicIds returns the ids of topics that lie on a parent cycle, including
// topics that are their own parent. Topics that merely descend from a cycle are
// left out: they still reach a rendered ancestor once the cycle is broken.
function findCyclicIds(
	nodesById: ReadonlyMap<TopicId, TopicWithChildren>,
): Set<TopicId> {
	const cyclicIds = new Set<TopicId>()
	const settledIds = new Set<TopicId>()

	for (const startId of nodesById.keys()) {
		const path: Array<TopicId> = []
		const pathIndexById = new Map<TopicId, number>()
		let currentId: TopicId | undefined = startId

		// Walk up the parent chain until it ends, rejoins an already classified
		// chain, or revisits a topic we passed on this walk.
		while (currentId && !settledIds.has(currentId)) {
			const revisitedAt = pathIndexById.get(currentId)

			if (revisitedAt !== undefined) {
				for (const id of path.slice(revisitedAt)) cyclicIds.add(id)
				break
			}

			pathIndexById.set(currentId, path.length)
			path.push(currentId)

			const parentId: TopicId | undefined =
				nodesById.get(currentId)?.parentId
			currentId =
				parentId && nodesById.has(parentId) ? parentId : undefined
		}

		for (const id of path) settledIds.add(id)
	}

	return cyclicIds
}
