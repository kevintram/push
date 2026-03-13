import type { Topic } from '../types/topic.types'

export type TopicTreeNode = Topic & {
	children: Array<TopicTreeNode>
}

export type TopicTree = {
	roots: Array<TopicTreeNode>
	nodeById: Map<number, TopicTreeNode>
	ancestorIdsById: Map<number, Array<number>>
}

export function getTopicDisplayTitle(title: string) {
	const trimmedTitle = title.trim()
	return trimmedTitle.length > 0 ? trimmedTitle : 'Untitled topic'
}

export function buildTopicTree(topics: Array<Topic>): TopicTree {
	const nodeById = new Map<number, TopicTreeNode>()

	for (const topic of topics) {
		nodeById.set(topic.id, {
			...topic,
			children: []
		})
	}

	const roots: Array<TopicTreeNode> = []

	for (const topic of topics) {
		const node = nodeById.get(topic.id)
		if (!node) continue

		if (topic.parent_id == null) {
			roots.push(node)
			continue
		}

		const parentNode = nodeById.get(topic.parent_id)
		if (!parentNode) {
			roots.push(node)
			continue
		}

		parentNode.children.push(node)
	}

	const ancestorIdsById = new Map<number, Array<number>>()

	const visitNode = (node: TopicTreeNode, ancestorIds: Array<number>) => {
		ancestorIdsById.set(node.id, ancestorIds)

		for (const child of node.children) {
			visitNode(child, [...ancestorIds, node.id])
		}
	}

	for (const rootNode of roots) {
		visitNode(rootNode, [])
	}

	return {
		roots,
		nodeById,
		ancestorIdsById
	}
}
