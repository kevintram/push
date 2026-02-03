import type { Practice } from '~/features/practices/types/practice.types'
import type { Source } from '~/features/sources/types/source.types'
import type { Topic } from '~/features/topics/types/topic.types'

export type SearchResultItem =
	| {
			entity_type: 'topic'
			topic: Topic
			source: null
			practice: null
			recent_activity_at: string
	  }
	| {
			entity_type: 'source'
			topic: null
			source: Source
			practice: null
			recent_activity_at: string
	  }
	| {
			entity_type: 'practice'
			topic: null
			source: null
			practice: Practice
			recent_activity_at: string
	  }

export type SearchAllParams = {
	query?: string
	entityTypes?: string
	limit?: number
}
