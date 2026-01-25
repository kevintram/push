import type { PracticeCreate } from '~/features/practices/types/practice.types'
import type { LearningState } from '~/models/learning-state.types'
import type { Rating, ReviewEntry, ReviewSession } from './review.types'

export type CreateReviewSessionInput = {
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

export type ReviewSessionCreate = {
	description: string
	notes: string
	scheduled_at?: string | null
	completed_at?: string | null
}

export type SourceCreate = {
	title?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
	parent_id?: number | null
	srs_enabled?: boolean
	inherit_fsrs?: boolean
}

export type CreateReviewPayload = {
	rating?: Rating | null
	description?: string
	notes?: string
	scheduled_at?: string | null
	completed_at?: string | null
} & (
	| {
			topic_id: number
			topic?: never
			source_id?: never
			source?: never
			practice_id?: never
			practice?: never
	  }
	| {
			topic: TopicCreate
			topic_id?: never
			source_id?: never
			source?: never
			practice_id?: never
			practice?: never
	  }
	| {
			source_id: number
			source?: never
			topic_id?: never
			topic?: never
			practice_id?: never
			practice?: never
	  }
	| {
			source: SourceCreate
			source_id?: never
			topic_id?: never
			topic?: never
			practice_id?: never
			practice?: never
	  }
	| {
			practice_id: number
			practice?: never
			topic_id?: never
			topic?: never
			source_id?: never
			source?: never
	  }
	| {
			practice: PracticeCreate
			practice_id?: never
			topic_id?: never
			topic?: never
			source_id?: never
			source?: never
	  }
) &
	(
		| { review_session_id: number; review_session?: never }
		| { review_session: ReviewSessionCreate; review_session_id?: never }
		| { review_session_id?: never; review_session?: never }
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

export type UpdateReviewSessionInput = {
	id: number
	description?: string
	notes?: string
	scheduled_at?: string | null
	completed_at?: string | null
}

export type UpdateReviewInput = {
	id: number
	rating?: Rating | null
	description?: string
	notes?: string
	scheduled_at?: string | null
	completed_at?: string | null
	review_session_id?: number | null
}

export type GetReviewSessionsFilters = {
	effectiveDateBefore?: string
	effectiveDateAfter?: string
	scheduled?: boolean
	completed?: boolean
}

export type GetReviewsFilters = {
	reviewSessionId?: number
	topicId?: number
	sourceId?: number
	effectiveDateBefore?: string
	effectiveDateAfter?: string
	scheduled?: boolean
	completed?: boolean
}

export type GetReviewEntriesFilters = {
	topicId?: number
	effectiveDateBefore?: string
	effectiveDateAfter?: string
	scheduled?: boolean
	completed?: boolean
	sort?: 'asc' | 'desc'
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
	entries: Array<ReviewSession>
}

export type LogbookSection = {
	id: string
	label: string
	entries: Array<ReviewSession>
}

// Entry-based section types for unified review entries endpoint
export type TodayEntrySection = {
	id: TodaySectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
	entries: Array<ReviewEntry>
}

export type SoonEntrySection = {
	id: SoonSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
	entries: Array<ReviewEntry>
}

export type UnscheduledEntrySection = {
	id: 'unscheduled'
	label: string
	headingClassName?: string
	emptyMessage: string
	entries: Array<ReviewEntry>
}

export type FutureEntrySection = {
	id: string
	label: string
	entries: Array<ReviewEntry>
}

export type LogbookEntrySection = {
	id: string
	label: string
	entries: Array<ReviewEntry>
}
