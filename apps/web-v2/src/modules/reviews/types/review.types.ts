import type { DateString } from '~/types/date'

export type ReviewCard = {
	id: string
	topic_id: string
	primary_text: string
	secondary_text: string
	notes: string
}

export type ReviewCardFilters = {
	due?: 'late' | 'new' | DateString
	topicId?: string
}

export type Rating = 'miss' | 'hard' | 'good' | 'easy'

export type Review = {
	id: string
	review_card_id: string
	rating: Rating | null
	description: string
	notes: string
	scheduled_at: string | null
	completed_at: string | null
	effective_date: string | null
	inserted_at: string
	updated_at: string
	review_card: {
		id: string
		topic_id: string
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
	reviewCardId: string
	order?: 'asc' | 'desc'
}
