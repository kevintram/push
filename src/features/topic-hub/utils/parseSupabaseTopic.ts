import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'

type TableTopic = Tables<'topics'> & {
	timeline_entries?: Array<Tables<'timeline_entries'>>
}

export function parseSupabaseTopic(t: TableTopic): Topic {
	return {
		...t,
		timeline_entries: t.timeline_entries || [],
		children: [],
		parents: [],
		practicePrompts: []
	}
}
