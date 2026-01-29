import * as v from 'valibot'
import { PracticeSchema } from '~/features/practices/types/practice.schemas'
import { SourceSchema } from '~/features/sources/types/source.schemas'
import { TopicSchema } from '~/features/topics/types/topic.schemas'
import type {
	Review,
	ReviewEntry,
	ReviewEntryReview,
	ReviewEntrySession,
	ReviewListItem,
	ReviewSession
} from './review.types'

export const ReviewSchema: v.GenericSchema<Review> = v.object({
	id: v.number(),
	review_session_id: v.nullable(v.number()),
	// Polymorphic entity references (exactly one will be set)
	topic_id: v.nullable(v.number()),
	source_id: v.nullable(v.number()),
	practice_id: v.nullable(v.number()),
	rating: v.nullable(v.picklist(['miss', 'hard', 'good', 'easy'])),

	description: v.string(),
	notes: v.string(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),

	inserted_at: v.string(),
	updated_at: v.string(),
	// Polymorphic entity relationships
	topic: v.optional(v.nullable(v.lazy(() => TopicSchema))),
	source: v.optional(v.nullable(v.lazy(() => SourceSchema))),
	practice: v.optional(v.nullable(v.lazy(() => PracticeSchema))),
	review_session: v.nullable(
		v.object({
			id: v.number(),
			description: v.nullable(v.string())
		})
	),

	// Entity FSRS state before review
	stability_before: v.nullable(v.number()),
	difficulty_before: v.nullable(v.number()),
	state_before: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	step_before: v.nullable(v.number()),
	due_before: v.nullable(v.string()),

	// Entity FSRS state after review
	stability_after: v.nullable(v.number()),
	difficulty_after: v.nullable(v.number()),
	state_after: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	step_after: v.nullable(v.number()),
	due_after: v.nullable(v.string())
})

export const ReviewListItemSchema: v.GenericSchema<ReviewListItem> = v.object({
	id: v.number(),
	review_session_id: v.nullable(v.number()),
	// Polymorphic entity references (exactly one will be set)
	topic_id: v.nullable(v.number()),
	source_id: v.nullable(v.number()),
	practice_id: v.nullable(v.number()),
	rating: v.nullable(v.picklist(['miss', 'hard', 'good', 'easy'])),

	description: v.string(),
	notes: v.string(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),

	inserted_at: v.string(),
	updated_at: v.string(),

	review_session: v.nullable(
		v.object({
			id: v.number(),
			description: v.nullable(v.string())
		})
	),
	// Polymorphic entity summaries
	topic: v.optional(
		v.nullable(
			v.object({
				id: v.number(),
				name: v.string(),
				notes: v.string()
			})
		)
	),
	source: v.optional(
		v.nullable(
			v.object({
				id: v.number(),
				title: v.string(),
				notes: v.string()
			})
		)
	),
	practice: v.optional(
		v.nullable(
			v.object({
				id: v.number(),
				prompt: v.string(),
				answer: v.string()
			})
		)
	),

	// Entity FSRS state before review
	stability_before: v.nullable(v.number()),
	difficulty_before: v.nullable(v.number()),
	state_before: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	step_before: v.nullable(v.number()),
	due_before: v.nullable(v.string()),

	// Entity FSRS state after review
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
	reviews: v.optional(v.array(v.lazy(() => ReviewListItemSchema)), [])
})

// Discriminated union schemas for unified review entries endpoint
export const ReviewEntrySessionSchema: v.GenericSchema<ReviewEntrySession> =
	v.object({
		type: v.literal('session'),
		effective_date: v.nullable(v.string()),
		data: v.lazy(() => ReviewSessionSchema)
	})

export const ReviewEntryReviewSchema: v.GenericSchema<ReviewEntryReview> =
	v.object({
		type: v.literal('review'),
		effective_date: v.nullable(v.string()),
		data: v.lazy(() => ReviewListItemSchema)
	})

export const ReviewEntrySchema: v.GenericSchema<ReviewEntry> = v.union([
	ReviewEntrySessionSchema,
	ReviewEntryReviewSchema
])
