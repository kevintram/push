import type { ReviewCard } from '~/features/review-cards/types/review-card.types'
import type { Topic } from '~/features/topics/types/topic.types'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import {
	buildTopicTree,
	getTopicDisplayTitle
} from '~/features/topics/utils/topicTree'

export type TopicDetailSectionNode = {
	children: Array<TopicDetailSectionNode>
	depth: number
	headingLevel: number
	topic: TopicTreeNode
	topicPath: Array<Pick<TopicTreeNode, 'id' | 'title' | 'body'>>
}

const MAX_HEADING_LEVEL = 6
const TOPIC_DETAIL_HASH_PREFIX = 'topic-'

export function buildTopicDetailRoot(
	topics: Array<Topic>,
	rootTopicId: number
): TopicDetailSectionNode | null {
	const { nodeById } = buildTopicTree(topics)
	const rootNode = nodeById.get(rootTopicId)

	if (!rootNode) return null

	const buildSectionNode = (
		node: TopicTreeNode,
		depth: number,
		topicPath: Array<Pick<TopicTreeNode, 'id' | 'title' | 'body'>>
	): TopicDetailSectionNode => ({
		children: node.children.map(childNode =>
			buildSectionNode(childNode, depth + 1, [
				...topicPath,
				{
					id: childNode.id,
					title: childNode.title,
					body: childNode.body
				}
			])
		),
		depth,
		headingLevel: Math.min(depth + 1, MAX_HEADING_LEVEL),
		topic: node,
		topicPath
	})

	return buildSectionNode(rootNode, 0, [
		{
			id: rootNode.id,
			title: rootNode.title,
			body: rootNode.body
		}
	])
}

export function flattenTopicDetailSectionIds(
	rootSection: TopicDetailSectionNode | null
): Array<number> {
	if (!rootSection) return []

	const ids: Array<number> = []

	const visitSection = (section: TopicDetailSectionNode) => {
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

export function getTopicDetailHash(topicId: number) {
	return `#${TOPIC_DETAIL_HASH_PREFIX}${topicId}`
}

export function getTopicDetailSectionId(topicId: number) {
	return `${TOPIC_DETAIL_HASH_PREFIX}${topicId}`
}

export function parseTopicDetailHash(hash: string) {
	if (!hash.startsWith('#')) return null
	if (!hash.startsWith(`#${TOPIC_DETAIL_HASH_PREFIX}`)) return null

	const parsedTopicId = Number.parseInt(
		hash.slice(TOPIC_DETAIL_HASH_PREFIX.length + 1),
		10
	)

	return Number.isFinite(parsedTopicId) ? parsedTopicId : null
}

export function getTopicDetailLabel(title: string, body?: string) {
	return getTopicDisplayTitle(title, body)
}
