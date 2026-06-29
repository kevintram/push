import { type ReviewCard } from '~/modules/review-cards/types/review-card.types'
import { type Topic } from '~/modules/topics/types/topic.types'
import { type TopicTreeNode } from '~/modules/topics/utils/topicTree'
import {
	buildTopicTree,
	getTopicDisplayTitle,
} from '~/modules/topics/utils/topicTree'

export type TopicDetailSectionNode = {
	children: Array<TopicDetailSectionNode>
	depth: number
	headingLevel: number
	sectionNumber: string | null
	topic: TopicTreeNode
	topicPath: Array<Pick<TopicTreeNode, 'id' | 'title' | 'body'>>
}

const MAX_HEADING_LEVEL = 6
const TOPIC_DETAIL_HASH_PREFIX = 'topic-'
export const TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID = 0

type TopicDetailPathItem = Pick<TopicTreeNode, 'id' | 'title' | 'body'>
type TopicDetailSectionsOptions = {
	baseDepth?: number
}

function toTopicDetailPathItem(node: TopicTreeNode): TopicDetailPathItem {
	return {
		id: node.id,
		title: node.title,
		body: node.body,
	}
}

function buildTopicDetailSectionNode(
	node: TopicTreeNode,
	depth: number,
	sectionNumberSegments: Array<number>,
	topicPath: Array<TopicDetailPathItem>,
): TopicDetailSectionNode {
	return {
		children: node.children.map((childNode, index) =>
			buildTopicDetailSectionNode(
				childNode,
				depth + 1,
				[...sectionNumberSegments, index + 1],
				[...topicPath, toTopicDetailPathItem(childNode)],
			),
		),
		depth,
		headingLevel: Math.min(depth + 1, MAX_HEADING_LEVEL),
		sectionNumber:
			sectionNumberSegments.length > 0
				? sectionNumberSegments.join('.')
				: null,
		topic: node,
		topicPath,
	}
}

function visitTopicDetailSections(
	sections: Array<TopicDetailSectionNode>,
	visitor: (section: TopicDetailSectionNode) => void,
): void {
	for (const section of sections) {
		visitor(section)
		visitTopicDetailSections(section.children, visitor)
	}
}

export function buildTopicDetailSections(
	nodes: Array<TopicTreeNode>,
	options?: TopicDetailSectionsOptions,
): Array<TopicDetailSectionNode> {
	const { baseDepth = 0 } = options ?? {}

	return nodes.map((node, index) =>
		buildTopicDetailSectionNode(
			node,
			baseDepth,
			[index + 1],
			[toTopicDetailPathItem(node)],
		),
	)
}

export function flattenTopicDetailSectionIdsFromSections(
	sections: Array<TopicDetailSectionNode>,
): Array<number> {
	const ids: Array<number> = []
	visitTopicDetailSections(sections, section => {
		ids.push(section.topic.id)
	})
	return ids
}

export function buildTopicDetailSectionNumberByIdFromSections(
	sections: Array<TopicDetailSectionNode>,
): Map<number, string> {
	const sectionNumberById = new Map<number, string>()

	visitTopicDetailSections(sections, section => {
		if (section.sectionNumber) {
			sectionNumberById.set(section.topic.id, section.sectionNumber)
		}
	})

	return sectionNumberById
}

export function buildTopicDetailRoot(
	topics: Array<Topic>,
	rootTopicId: number,
): TopicDetailSectionNode | null {
	const { nodeById } = buildTopicTree(topics)
	const rootNode = nodeById.get(rootTopicId)

	if (!rootNode) return null

	return buildTopicDetailSectionNode(
		rootNode,
		0,
		[],
		[toTopicDetailPathItem(rootNode)],
	)
}

export function flattenTopicDetailSectionIds(
	rootSection: TopicDetailSectionNode | null,
): Array<number> {
	if (!rootSection) return []
	return flattenTopicDetailSectionIdsFromSections([rootSection])
}

export function buildTopicDetailSectionNumberById(
	rootSection: TopicDetailSectionNode | null,
): Map<number, string> {
	if (!rootSection) return new Map<number, string>()
	return buildTopicDetailSectionNumberByIdFromSections([rootSection])
}

export function groupReviewCardsByTopicId(
	reviewCards: Array<ReviewCard>,
): Map<number, Array<ReviewCard>> {
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

export function getTopicDetailHash(topicId: number): string {
	return `#${TOPIC_DETAIL_HASH_PREFIX}${topicId}`
}

export function getTopicDetailSectionId(topicId: number): string {
	return `${TOPIC_DETAIL_HASH_PREFIX}${topicId}`
}

export function parseTopicDetailHash(hash: string): number | null {
	if (!hash.startsWith('#')) return null
	if (!hash.startsWith(`#${TOPIC_DETAIL_HASH_PREFIX}`)) return null

	const parsedTopicId = Number.parseInt(
		hash.slice(TOPIC_DETAIL_HASH_PREFIX.length + 1),
		10,
	)

	return Number.isFinite(parsedTopicId) ? parsedTopicId : null
}

export function getTopicDetailLabel(title: string, body?: string): string {
	return getTopicDisplayTitle(title, body)
}
