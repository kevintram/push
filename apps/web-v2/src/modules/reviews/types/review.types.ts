import type { DateString } from '~/types/date'

export type ReviewCard = {
	id: number
	topic_id: number
	primary_text: string
	secondary_text: string
	notes: string
}

export type ReviewCardFilters = {
	due?: 'late' | 'new' | DateString
	topicId?: number | string
}

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
	stability_before: number | null
	difficulty_before: number | null
	state_before: 'LEARNING' | 'REVIEW' | 'RELEARNING' | null
	step_before: number | null
	due_before: string | null
	stability_after: number | null
	difficulty_after: number | null
	state_after: 'LEARNING' | 'REVIEW' | 'RELEARNING' | null
	step_after: number | null
	due_after: string | null
}

export type ReviewFilters = {
	reviewCardId: number | string
	order?: 'asc' | 'desc'
}
