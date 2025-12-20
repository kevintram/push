import * as v from 'valibot'
import { TopicSchema } from '~/features/topics/types/topic.schemas'
import type { Review, ReviewListItem, ReviewSession } from './review.types'

export const ReviewSchema: v.GenericSchema<Review> = v.object({
	id: v.number(),
	review_session_id: v.number(),
	topic_id: v.number(),
	rating: v.nullable(v.picklist(['miss', 'hard', 'good', 'easy'])),

	description: v.string(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),

	inserted_at: v.string(),
	updated_at: v.string(),
	topic: v.lazy(() => TopicSchema),

	// Topic FSRS state before review
	stability_before: v.nullable(v.number()),
	difficulty_before: v.nullable(v.number()),
	state_before: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	step_before: v.nullable(v.number()),
	due_before: v.nullable(v.string()),

	// Topic FSRS state after review
	stability_after: v.nullable(v.number()),
	difficulty_after: v.nullable(v.number()),
	state_after: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	step_after: v.nullable(v.number()),
	due_after: v.nullable(v.string())
})

export const ReviewListItemSchema: v.GenericSchema<ReviewListItem> = v.object({
	id: v.number(),
	review_session_id: v.number(),
	topic_id: v.number(),
	rating: v.nullable(v.picklist(['miss', 'hard', 'good', 'easy'])),

	description: v.string(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),

	inserted_at: v.string(),
	updated_at: v.string(),

	review_session: v.object({
		id: v.number(),
		description: v.nullable(v.string())
	}),
	topic: v.object({
		id: v.number(),
		name: v.string(),
		notes: v.string()
	}),

	// Topic FSRS state before review
	stability_before: v.nullable(v.number()),
	difficulty_before: v.nullable(v.number()),
	state_before: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	step_before: v.nullable(v.number()),
	due_before: v.nullable(v.string()),

	// Topic FSRS state after review
	stability_after: v.nullable(v.number()),
	difficulty_after: v.nullable(v.number()),
	state_after: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	step_after: v.nullable(v.number()),
	due_after: v.nullable(v.string())
})

export const ReviewSessionSchema: v.GenericSchema<ReviewSession> = v.object({
	id: v.number(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),
	inserted_at: v.string(),
	updated_at: v.string(),
	description: v.string(),
	notes: v.string(),
	reviews: v.optional(v.array(v.lazy(() => ReviewSchema)), [])
})
