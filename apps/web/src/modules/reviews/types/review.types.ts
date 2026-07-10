import { type LearningState } from '~/models/learning-state.types'

export type Rating = 'miss' | 'hard' | 'good' | 'easy'

export type Review = {
	id: number
	reviewCardId: number
	rating: Rating | null

	description: string
	notes: string
	scheduledAt: string | null
	completedAt: string | null
	effectiveDate: string | null

	insertedAt: string
	updatedAt: string
	reviewCard: {
		id: number
		topicId: number
		type: 'practice' | 'flashcard'
		primaryText: string
		secondaryText: string
	}

	// Entity FSRS state before review
	stabilityBefore: number | null
	difficultyBefore: number | null
	stateBefore: LearningState | null
	stepBefore: number | null
	dueBefore: string | null

	// Entity FSRS state after review
	stabilityAfter: number | null
	difficultyAfter: number | null
	stateAfter: LearningState | null
	stepAfter: number | null
	dueAfter: string | null
}

export type ReviewListItem = Review
