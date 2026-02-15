import type { Practice } from '~/features/practices/types/practice.types'
import type { Source } from '~/features/sources/types/source.types'
import type { Topic } from '~/features/topics/types/topic.types'

export type ReviewQueueItem = {
	queue_type: 'due' | 'hazy'
	entity_type: 'topic' | 'source' | 'practice'
	topic?: Topic | null
	source?: Source | null
	practice?: Practice | null
	review_id?: number | null
	scheduled_at?: string | null
	days_until_due?: number | null
	days_until_hazy?: number | null
}
