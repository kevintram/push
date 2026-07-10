import { type LearningState } from './learning-state.types'

export type FreshnessTier = 'Fresh' | 'Fine' | 'Hazy' | 'Forgotten'
export type ReviewRating = 'miss' | 'hard' | 'good' | 'easy'

/**
 * Shared FSRS fields required for metrics calculations.
 * Used by useLearnableMetrics hook.
 */
export type LearnableMetricsInput = {
	retrievability: number | null
	freshnessTier: FreshnessTier | null
	daysUntilNextTier: number | null
	stability: number | null
	lastReviewedAt: string | null
	inheritedStability: number | null
	retired?: boolean | null
}

/**
 * Base fields shared by all learnable items (topics, sources, and practices).
 * This captures the common shape of all entities for shared abstractions.
 */
export type LearnableBase = {
	id: number
	notes?: string
	insertedAt: string
	updatedAt: string
	parentId?: number | null
	// FSRS fields
	stability: number | null
	difficulty: number | null
	state: LearningState
	step: number | null
	retired: boolean
	lastReviewedAt: string | null
	lastReviewRating: ReviewRating | null
	// Inherited FSRS
	inheritedStability: number | null
	inheritedDifficulty: number | null
	inheritedState: LearningState | null
	inheritedStep: number | null
	inheritedLastReview: string | null
	// Computed
	retrievability: number | null
	freshnessTier: FreshnessTier | null
	daysUntilNextTier: number | null
	daysInCurrentTier: number | null
	childrenCount?: number
}
