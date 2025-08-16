import type { Tables } from '~/types/database.types'

export function parseSupabaseTopic(t: Tables<'topics'>) {
	return {
		id: t.id,
		title: t.name,
		notes: t.notes ?? '',
		created: new Date(t.created_at!),
		stability: t.stability,
		retrievability: t.retrievability,
		children: [],
		parents: [],
		practicePrompts: [],
		reviewHistory: []
	}
}
