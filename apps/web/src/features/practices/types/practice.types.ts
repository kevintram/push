import type { Source } from '~/features/sources/types/source.types'
import type { Topic } from '~/features/topics/types/topic.types'
import type { FreshnessTier, ReviewRating } from '~/models/learnable.types'
import type { LearningState } from '~/models/learning-state.types'

export type Practice = {
	id: number
	prompt: string
	answer: string
	inserted_at: string
	updated_at: string
	recent_activity_at?: string | null
	fsrs_state_id: number | null
	archived: boolean
	inboxed: boolean
	// FSRS fields
	stability: number | null
	difficulty: number | null
	state: LearningState
	step: number | null
	srs_enabled: boolean
	last_reviewed_at: string | null
	last_review_rating: ReviewRating | null
	// Inherited FSRS fields (not used for practices, but kept for consistency)
	inherited_stability: number | null
	inherited_difficulty: number | null
	inherited_state: LearningState | null
	inherited_step: number | null
	inherited_last_review: string | null
	// Computed fields
	retrievability: number | null
	freshness_tier: FreshnessTier | null
	days_until_next_tier: number | null
	// Relationship counts
	topics_count?: number
	sources_count?: number
	// Relationships (loaded conditionally)
	topics?: Array<Topic>
	sources?: Array<Source>
}

export type PracticeTopicResponse = {
	practice: Practice
	topic: Topic
}

export type PracticeSourceResponse = {
	practice: Practice
	source: Source
}

export type PracticeCreate = {
	prompt?: string
	answer?: string
	archived?: boolean
	inboxed?: boolean
	srs_enabled?: boolean
	inherit_fsrs?: boolean
}

export type PracticeUpdate = {
	prompt?: string
	answer?: string
	archived?: boolean
	inboxed?: boolean
	srs_enabled?: boolean
}

export type PracticeTopicAdd = {
	topic_id: number
}

export type PracticeSourceAdd = {
	source_id: number
}
