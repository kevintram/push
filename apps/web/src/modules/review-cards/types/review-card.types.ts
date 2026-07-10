import { type ReviewCardStatusBadge } from './status-badge.types'
export type ReviewCardType = 'practice' | 'flashcard'
export type ReviewFilter = 'all' | 'practice' | 'flashcards'
export type ReviewFocusOrder = 'due-date' | 'random'
export type ReviewQueueMode = 'list' | 'focus'

export type ReviewCard = {
	id: number
	topicId: number
	topicTitle: string
	type: ReviewCardType
	primaryText: string
	secondaryText: string
	notes: string
	insertedAt: string
	updatedAt: string
	lastReviewRating: 'miss' | 'hard' | 'good' | 'easy' | null
	stability: number | null
	difficulty: number | null
	state: string
	step: number | null
	retired: boolean
	flaggedAt: string | null
	lastReviewedAt: string | null
	retrievability: number | null
	freshnessTier: string | null
	daysUntilNextTier: number | null
	daysInCurrentTier: number | null
	isNew: boolean
	reviewsPendingCount?: number
	reviewsOverdueCount?: number
	reviewsDueTodayCount?: number
	statusBadges: Array<ReviewCardStatusBadge>
}

export type ReviewCardQueueItem = {
	queueType: 'due' | 'hazy' | 'new'
	card: ReviewCard
	reviewId: number | null
	scheduledAt: string | null
	actionDays: number | null
	daysUntilDue: number | null
	daysUntilHazy: number | null
}

export type ReviewCardQueuePage = {
	items: Array<ReviewCardQueueItem>
	asOf: string
}

export type ReviewCardQueueSummary = {
	overdueCount: number
	dueTodayCount: number
	dueNextSevenDaysCount: number
	newCount: number
	asOf: string
}

export type ReviewCardFlaggedSummary = {
	flaggedCount: number
}

export type ReviewCardDueFilter =
	| 'late'
	| 'new'
	| `${number}-${number}-${number}`
type ReviewCardOrderField = 'inserted_at' | 'due'
export type ReviewCardOrderBy =
	| ReviewCardOrderField
	| `-${ReviewCardOrderField}`
	| `${ReviewCardOrderField},${ReviewCardOrderField}`
	| `${ReviewCardOrderField},-${ReviewCardOrderField}`
	| `-${ReviewCardOrderField},${ReviewCardOrderField}`
	| `-${ReviewCardOrderField},-${ReviewCardOrderField}`

export type GetReviewCardsParams = {
	topic_id?: number
	include_descendants?: boolean
	type?: ReviewCardType
	due?: ReviewCardDueFilter
	flagged?: boolean
	retired?: boolean
	order_by?: ReviewCardOrderBy
}

type ReviewCardQueueBaseParams = {
	include_future?: boolean
	mode?: ReviewQueueMode
}

export type ReviewCardQueueSummaryParams =
	| { filter: ReviewFilter; type?: never }
	| { filter?: never; type: ReviewCardType }

export type ReviewCardQueueParams = ReviewCardQueueBaseParams &
	ReviewCardQueueSummaryParams

export type CreateReviewCardReviewPayload = {
	rating?: 'miss' | 'hard' | 'good' | 'easy' | null
	description?: string
	notes?: string
	scheduledAt?: string | null
	completedAt?: string | null
}

export type CreateReviewCardPayload = {
	topicId: number
	type: ReviewCardType
	primaryText?: string
	secondaryText?: string
	notes?: string
	retired?: boolean
}

export type UpdateReviewCardInput = {
	id: number
	topicId?: number
	type?: ReviewCardType
	primaryText?: string
	secondaryText?: string
	notes?: string
	retired?: boolean
	flagged?: boolean
}
