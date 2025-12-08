import type { LearningState, Rating, Review } from '~/models/review-topic.types'

export type CreateReviewInput = {
	description: string
	notes?: string
	scheduledAt?: string | null
	completedAt?: string | null
}

export type TopicCreate = {
	name: string
	notes: string
	archived: boolean
	inboxed: boolean
	stability?: number | null
	difficulty?: number | null
	state?: LearningState
	step?: number | null
	due?: string | null
	srs_enabled?: boolean
}

export type ReviewCreate = {
	description: string
	notes: string
	scheduled_at?: string | null
	completed_at?: string | null
}

export type CreateTopicReviewPayload = {
	rating?: Rating | null
} & (
	| { topic_id: number; topic?: never }
	| { topic: TopicCreate; topic_id?: never }
) &
	(
		| { review_id: number; review?: never }
		| { review: ReviewCreate; review_id?: never }
	)

export type CreateTopicWithReviewInput = {
	name?: string
	notes?: string
	stability?: number | null
	difficulty?: number | null
	state?: 'LEARNING' | 'REVIEW' | 'RELEARNING'
	archived?: boolean
	inboxed?: boolean
}

export type UpdateReviewInput = {
	id: number
	description?: string
	notes?: string
	scheduled_at?: string | null
	completed_at?: string | null
}

export type GetReviewsFilters = {
	topicId?: number
	effectiveDateBefore?: string
	effectiveDateAfter?: string
	scheduled?: boolean
	completed?: boolean
}

export type TodaySectionKey = 'overdue' | 'today'

export type SectionDefinition = {
	id: TodaySectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

export type SoonSectionKey = 'tomorrow' | 'nextSevenDays'

export type SoonSectionDefinition = {
	id: SoonSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

export type UnscheduledSectionDefinition = {
	id: 'unscheduled'
	label: string
	headingClassName?: string
	emptyMessage: string
}

export type FutureSection = {
	id: string
	label: string
	entries: Array<Review>
}

export type LogbookSection = {
	id: string
	label: string
	entries: Array<Review>
}
