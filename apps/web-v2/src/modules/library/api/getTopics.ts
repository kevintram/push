import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { TopicSchema } from '../types/topic.schemas'
import type { Topic, TopicWithChildren } from '../types/topic.types'

export async function fetchTopics(): Promise<Array<TopicWithChildren>> {
	const topics = await apiFetch(v.array(TopicSchema), '/topics/')
	return treeify(topics)
}

export async function fetchTopic(topicId: string): Promise<Topic> {
	return apiFetch(TopicSchema, `/topics/${topicId}/`)
}

/**
 * @param topics flat array of topics
 * @returns topic tree
 */
function treeify(topics: Array<Topic>): Array<TopicWithChildren> {
	const topicById = new Map<string, TopicWithChildren>()

	for (const topic of topics) {
		topicById.set(topic.id, {
			...topic,
			children: [],
		})
	}

	const roots: Array<TopicWithChildren> = []

	for (const topic of topics) {
		const node = topicById.get(topic.id)
		if (!node) continue

		if (topic.parentId === undefined) {
			roots.push(node)
			continue
		}

		const parent = topicById.get(topic.parentId)
		if (!parent) {
			roots.push(node)
			continue
		}

		parent.children?.push(node)
	}

	return roots
}
