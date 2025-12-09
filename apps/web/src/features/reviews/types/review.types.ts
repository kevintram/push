import type { Topic } from '~/features/topics/types/topic.types'
import type { LearningState } from '~/models/learning-state.types'

export type Rating = 'miss' | 'hard' | 'good' | 'easy'

export type TopicReview = {
	id: number
	review_id: number
	topic_id: number
	rating: Rating | null
	inserted_at: string
	updated_at: string
	topic: Topic

	// Topic FSRS state before review
	stability_before: number | null
	difficulty_before: number | null
	state_before: LearningState | null
	step_before: number | null
	due_before: string | null

	// Topic FSRS state after review
	stability_after: number | null
	difficulty_after: number | null
	state_after: LearningState | null
	step_after: number | null
	due_after: string | null
}

export type Review = {
	id: number
	scheduled_at: string | null
	completed_at: string | null
	effective_date: string | null
	inserted_at: string
	updated_at: string
	description: string
	notes: string
	topic_reviews?: Array<TopicReview>
}
