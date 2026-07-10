import * as v from 'valibot'

import { TopicSchema } from '../types/topic.schemas'
import type { Topic, TopicWithChildren } from '../types/topic.types'

export async function fetchTopics(): Promise<Array<TopicWithChildren>> {
	const url = new URL(import.meta.env.VITE_API_URL + '/topics/')

	const response = await fetch(url, { credentials: 'include' })
	if (!response.ok) {
		throw new Error(`Failed to fetch topics!: ${response.status}`)
	}

	const data = await response.json()
	const parsed = v.safeParse(v.array(TopicSchema), data)

	if (!parsed.success) {
		throw new Error(`Failed to parse topics! ${parsed.issues}`)
	}

	return treeify(parsed.output)
}

export async function fetchTopic(topicId: number | string): Promise<Topic> {
	const url = new URL(import.meta.env.VITE_API_URL + `/topics/${topicId}`)
	const response = await fetch(url, { credentials: 'include' })
	if (!response.ok) {
		throw new Error(`Failed to fetch topic ${topicId}: ${response.status}`)
	}

	const data = await response.json()

	return v.parse(TopicSchema, data)
}

/**
 * @param topics flat array of topics
 * @returns topic tree
 */
function treeify(topics: Array<Topic>): Array<TopicWithChildren> {
	const topicById = new Map<number, TopicWithChildren>()

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
