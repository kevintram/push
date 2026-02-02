import type { LearningState } from './learning-state.types'

export type RetrievabilityBucket = 'LATE' | 'ON_TIME' | 'EARLY'

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
	stability: number | null
	last_reviewed_at: string | null
	inherited_stability: number | null
}

/**
 * Base fields shared by all learnable items (topics and sources).
 * This captures the common shape of both entities for shared abstractions.
 */
export type LearnableBase = {
	id: number
	notes: string
	inserted_at: string
	updated_at: string
	parent_id: number | null
	archived: boolean
	inboxed: boolean
	// FSRS fields
	stability: number | null
	difficulty: number | null
	state: LearningState
	step: number | null
	srs_enabled: boolean
	last_reviewed_at: string | null
	// Inherited FSRS
	inherited_stability: number | null
	inherited_difficulty: number | null
	inherited_state: LearningState | null
	inherited_step: number | null
	inherited_last_review: string | null
	// Computed
	retrievability: number | null
	bucket: RetrievabilityBucket | null
	days_until_threshold: number | null
	children_count?: number
}
