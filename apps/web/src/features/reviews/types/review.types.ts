import type { LearningState } from '~/models/learning-state.types'

export type Rating = 'miss' | 'hard' | 'good' | 'easy'

export type Review = {
	id: number
	review_card_id: number
	rating: Rating | null

	description: string
	notes: string
	scheduled_at: string | null
	completed_at: string | null
	effective_date: string | null

	inserted_at: string
	updated_at: string
	review_card: {
		id: number
		topic_id: number
		type: 'practice' | 'flashcard'
		primary_text: string
		secondary_text: string
	}

	// Entity FSRS state before review
	stability_before: number | null
	difficulty_before: number | null
	state_before: LearningState | null
	step_before: number | null
	due_before: string | null

	// Entity FSRS state after review
	stability_after: number | null
	difficulty_after: number | null
	state_after: LearningState | null
	step_after: number | null
	due_after: string | null
}

export type ReviewListItem = Review
