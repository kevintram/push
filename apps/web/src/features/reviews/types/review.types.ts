import type { Practice } from '~/features/practices/types/practice.types'
import type { Source } from '~/features/sources/types/source.types'
import type { Topic } from '~/features/topics/types/topic.types'
import type { LearningState } from '~/models/learning-state.types'

export type Rating = 'miss' | 'hard' | 'good' | 'easy'

export type Review = {
	id: number
	// Polymorphic entity references (at most one will be set)
	topic_id: number | null
	source_id: number | null
	practice_id: number | null
	rating: Rating | null

	description: string
	notes: string
	scheduled_at: string | null
	completed_at: string | null
	effective_date: string | null

	inserted_at: string
	updated_at: string
	// Polymorphic entity relationships
	topic?: Topic | null
	source?: Source | null
	practice?: Practice | null

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

export type ReviewListItem = {
	id: number
	// Polymorphic entity references (at most one will be set)
	topic_id: number | null
	source_id: number | null
	practice_id: number | null
	rating: Rating | null

	description: string
	notes: string
	scheduled_at: string | null
	completed_at: string | null
	effective_date: string | null

	inserted_at: string
	updated_at: string
	// Polymorphic entity summaries
	topic?: {
		id: number
		name: string
		notes: string
	} | null
	source?: {
		id: number
		title: string
		notes: string
	} | null
	practice?: {
		id: number
		prompt: string
		answer: string
	} | null

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
