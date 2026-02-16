import type { LearningState } from './learning-state.types'

export type FreshnessTier = 'Fresh' | 'Fine' | 'Hazy' | 'Forgotten'
export type ReviewRating = 'miss' | 'hard' | 'good' | 'easy'

/**
 * Thin FSRS state projection used for inheritance decisions.
 */
export type FsrsState = {
	stability: number | null
	difficulty: number | null
	state: LearningState | null
	step: number | null
	lastReviewedAt: string | null
}

export type InheritOptions = { fsrsState?: FsrsState | null }

/**
 * Shared FSRS fields required for metrics calculations.
 * Used by useLearnableMetrics hook.
 */
export type LearnableMetricsInput = {
	retrievability: number | null
	freshness_tier: FreshnessTier | null
	days_until_next_tier: number | null
	stability: number | null
	last_reviewed_at: string | null
	inherited_stability: number | null
	srs_enabled: boolean | null
}

/**
 * Base fields shared by all learnable items (topics, sources, and practices).
 * This captures the common shape of all entities for shared abstractions.
 */
export type LearnableBase = {
	id: number
	notes?: string
	inserted_at: string
	updated_at: string
	parent_id?: number | null
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
	// Inherited FSRS
	inherited_stability: number | null
	inherited_difficulty: number | null
	inherited_state: LearningState | null
	inherited_step: number | null
	inherited_last_review: string | null
	// Computed
	retrievability: number | null
	freshness_tier: FreshnessTier | null
	days_until_next_tier: number | null
	days_in_current_tier: number | null
	children_count?: number
}
