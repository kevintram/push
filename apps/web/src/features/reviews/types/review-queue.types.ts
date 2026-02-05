import type { Practice } from '~/features/practices/types/practice.types'
import type { Source } from '~/features/sources/types/source.types'
import type { Topic } from '~/features/topics/types/topic.types'

export type ReviewQueueItem = {
	entity_type: 'topic' | 'source' | 'practice'
	topic?: Topic | null
	source?: Source | null
	practice?: Practice | null
}
