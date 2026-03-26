import type { ReviewCard } from '~/features/review-cards/types/review-card.types'
import type { Topic } from '~/features/topics/types/topic.types'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import {
	buildTopicTree,
	getTopicDisplayTitle
} from '~/features/topics/utils/topicTree'

export type TopicDocumentSectionNode = {
	children: Array<TopicDocumentSectionNode>
	depth: number
	headingLevel: number
	topic: TopicTreeNode
}

const MAX_HEADING_LEVEL = 6
const TOPIC_DOCUMENT_HASH_PREFIX = 'topic-'

export function buildTopicDocumentRoot(
	topics: Array<Topic>,
	rootTopicId: number
): TopicDocumentSectionNode | null {
	const { nodeById } = buildTopicTree(topics)
	const rootNode = nodeById.get(rootTopicId)

	if (!rootNode) return null

	const buildSectionNode = (
		node: TopicTreeNode,
		depth: number
	): TopicDocumentSectionNode => ({
		children: node.children.map(childNode =>
			buildSectionNode(childNode, depth + 1)
		),
		depth,
		headingLevel: Math.min(depth + 1, MAX_HEADING_LEVEL),
		topic: node
	})

	return buildSectionNode(rootNode, 0)
}

export function flattenTopicDocumentSectionIds(
	rootSection: TopicDocumentSectionNode | null
): Array<number> {
	if (!rootSection) return []

	const ids: Array<number> = []

	const visitSection = (section: TopicDocumentSectionNode) => {
		ids.push(section.topic.id)
		for (const childSection of section.children) {
			visitSection(childSection)
		}
	}

	visitSection(rootSection)

	return ids
}

export function groupReviewCardsByTopicId(reviewCards: Array<ReviewCard>) {
	const cardsByTopicId = new Map<number, Array<ReviewCard>>()

	for (const reviewCard of reviewCards) {
		const existingCards = cardsByTopicId.get(reviewCard.topic_id)
		if (existingCards) {
			existingCards.push(reviewCard)
			continue
		}

		cardsByTopicId.set(reviewCard.topic_id, [reviewCard])
	}

	return cardsByTopicId
}

export function getTopicDocumentHash(topicId: number) {
	return `#${TOPIC_DOCUMENT_HASH_PREFIX}${topicId}`
}

export function getTopicDocumentSectionId(topicId: number) {
	return `${TOPIC_DOCUMENT_HASH_PREFIX}${topicId}`
}

export function parseTopicDocumentHash(hash: string) {
	if (!hash.startsWith('#')) return null
	if (!hash.startsWith(`#${TOPIC_DOCUMENT_HASH_PREFIX}`)) return null

	const parsedTopicId = Number.parseInt(
		hash.slice(TOPIC_DOCUMENT_HASH_PREFIX.length + 1),
		10
	)

	return Number.isFinite(parsedTopicId) ? parsedTopicId : null
}

export function getTopicDocumentLabel(title: string, body?: string) {
	return getTopicDisplayTitle(title, body)
}
