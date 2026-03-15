import type { UniqueIdentifier } from '@dnd-kit/core'
import type { TopicTreeNode } from '../utils/topicTree'

const TOPIC_DROP_ID_PREFIX = 'topic-navigator-topic:'
const TOPIC_ROOT_DROP_ID_PREFIX = 'topic-navigator-root-drop:'

export function createRootDropId(position: 'top' | 'bottom'): string {
	return `${TOPIC_ROOT_DROP_ID_PREFIX}${position}`
}

export function createTopicDropId(topicId: number): string {
	return `${TOPIC_DROP_ID_PREFIX}${topicId}`
}

export function parseTopicDropId(
	id: UniqueIdentifier
): { type: 'root' } | { type: 'topic'; topicId: number } | null {
	if (typeof id === 'string' && id.startsWith(TOPIC_ROOT_DROP_ID_PREFIX)) {
		return { type: 'root' }
	}

	if (typeof id !== 'string' || !id.startsWith(TOPIC_DROP_ID_PREFIX)) {
		return null
	}

	const parsedTopicId = Number.parseInt(
		id.slice(TOPIC_DROP_ID_PREFIX.length),
		10
	)
	if (Number.isNaN(parsedTopicId)) return null

	return {
		type: 'topic',
		topicId: parsedTopicId
	}
}

export function mergeExpandedTopicIds({
	expandedIds,
	idsToExpand,
	validTopicIds
}: {
	expandedIds: Array<number>
	idsToExpand: Array<number>
	validTopicIds: Set<number>
}): Array<number> {
	const mergedIds = new Set<number>()

	for (const topicId of expandedIds) {
		if (validTopicIds.has(topicId)) {
			mergedIds.add(topicId)
		}
	}

	for (const topicId of idsToExpand) {
		if (validTopicIds.has(topicId)) {
			mergedIds.add(topicId)
		}
	}

	return [...mergedIds]
}

export function canReparentTopic({
	draggedTopicId,
	nextParentId,
	ancestorIdsById,
	nodeById
}: {
	draggedTopicId: number
	nextParentId: number | null
	ancestorIdsById: Map<number, Array<number>>
	nodeById: Map<number, TopicTreeNode>
}): boolean {
	const draggedNode = nodeById.get(draggedTopicId)
	if (!draggedNode) return false

	if (nextParentId === draggedNode.parent_id) return false
	if (nextParentId === draggedTopicId) return false

	if (nextParentId != null) {
		if (!nodeById.has(nextParentId)) return false
		if (ancestorIdsById.get(nextParentId)?.includes(draggedTopicId)) {
			return false
		}
	}

	return true
}
