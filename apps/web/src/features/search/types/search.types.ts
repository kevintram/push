import type { ReviewCard } from '~/features/review-cards/types/review-card.types'
import type { Topic } from '~/features/topics/types/topic.types'

export type SearchResultItem = {
	entity_type: 'topic' | 'review_card'
	topic: Topic | null
	review_card: ReviewCard | null
	recent_activity_at: string
}

export type SearchAllParams = {
	query?: string
	entityTypes?: string
	limit?: number
}
