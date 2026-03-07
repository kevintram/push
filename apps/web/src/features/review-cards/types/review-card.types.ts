import type { ReviewCardStatusBadge } from './status-badge.types'
export type ReviewCardType = 'practice' | 'flashcard'

export type ReviewCard = {
	id: number
	topic_id: number
	topic_title: string
	type: ReviewCardType
	prompt: string
	answer: string
	notes: string
	inserted_at: string
	updated_at: string
	last_review_rating: 'miss' | 'hard' | 'good' | 'easy' | null
	stability: number | null
	difficulty: number | null
	state: string
	step: number | null
	retired: boolean
	pinned_at: string | null
	last_reviewed_at: string | null
	retrievability: number | null
	freshness_tier: string | null
	days_until_next_tier: number | null
	days_in_current_tier: number | null
	is_new: boolean
	status_badges: Array<ReviewCardStatusBadge>
}

export type ReviewCardQueueItem = {
	queue_type: 'due' | 'hazy' | 'new'
	card: ReviewCard
	review_id: number | null
	scheduled_at: string | null
	days_until_due: number | null
	days_until_hazy: number | null
}

export type ReviewCardQueuePage = {
	items: Array<ReviewCardQueueItem>
	as_of: string
}

export type ReviewCardQueueSummary = {
	overdue_count: number
	due_today_count: number
	due_next_seven_days_count: number
	new_count: number
	as_of: string
}

export type ReviewCardPinnedSummary = {
	pinned_count: number
}

export type GetReviewCardsParams = {
	topic_id?: number
	type?: ReviewCardType
	new_only?: boolean
	pinned_only?: boolean
	order?: 'asc' | 'desc'
}

export type ReviewCardQueueParams = {
	type: ReviewCardType
	tab?: 'due' | 'new'
	focused?: boolean
	limit?: number
}

export type CreateReviewCardReviewPayload = {
	rating?: 'miss' | 'hard' | 'good' | 'easy' | null
	description?: string
	notes?: string
	scheduled_at?: string | null
	completed_at?: string | null
}

export type CreateReviewCardPayload = {
	topic_id: number
	type: ReviewCardType
	prompt?: string
	answer?: string
	notes?: string
	retired?: boolean
}

export type UpdateReviewCardInput = {
	id: number
	topic_id?: number
	type?: ReviewCardType
	prompt?: string
	answer?: string
	notes?: string
	retired?: boolean
	pinned?: boolean
}
