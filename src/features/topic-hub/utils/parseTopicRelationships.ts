import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'

export function parseTopicRelationships(
	directRelationships: Array<Tables<'topics_closure'>>, // relationships where depth = 1
	topics: Array<Tables<'topics'>>
): Map<number, Topic> {
	const m = new Map<number, Topic>()

	for (const t of topics) {
		m.set(t.id, {
			...t,
			parents: [] as Array<Topic>,
			children: [] as Array<Topic>
		})
	}

	for (const r of directRelationships) {
		const parent = m.get(r.ancestor)!
		const child = m.get(r.descendant)!

		parent.children.push(child)
		child.parents.push(parent)
	}

	return m
}

export function getRootTopics(m: Map<number, Topic>): Array<Topic> {
	return Array.from(m.values()).filter(t => t.parents.length === 0)
}
