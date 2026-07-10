import { type ReviewCard } from '~/modules/review-cards/types/review-card.types'
import { type Topic } from '~/modules/topics/types/topic.types'

export type SearchResultItem = {
	entityType: 'topic' | 'review_card'
	topic: Topic | null
	reviewCard: ReviewCard | null
	recentActivityAt: string
}

export type SearchAllParams = {
	query?: string
	entityTypes?: string
	limit?: number
}
