import * as v from 'valibot'

export type LearningState = 'LEARNING' | 'REVIEW' | 'RELEARNING'
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
	topics?: Array<Topic>
	topic_reviews?: Array<TopicReview>
}

export type Topic = {
	id: number
	name: string
	notes: string
	inserted_at: string
	updated_at: string
	stability: number | null
	difficulty: number | null
	state: LearningState
	step: number | null
	archived: boolean
	inboxed: boolean
	due: string | null
	parents?: Array<Topic>
	children?: Array<Topic>
	reviews?: Array<Review>
}

export const TopicReviewSchema: v.GenericSchema<TopicReview> = v.object({
	id: v.number(),
	review_id: v.number(),
	topic_id: v.number(),
	rating: v.nullable(v.picklist(['miss', 'hard', 'good', 'easy'])),
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

export const ReviewSchema: v.GenericSchema<Review> = v.object({
	id: v.number(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),
	inserted_at: v.string(),
	updated_at: v.string(),
	description: v.string(),
	topics: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	topic_reviews: v.optional(v.array(v.lazy(() => TopicReviewSchema)), [])
})

export const TopicSchema: v.GenericSchema<Topic> = v.object({
	id: v.number(),
	name: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	stability: v.nullable(v.number()),
	difficulty: v.nullable(v.number()),
	state: v.picklist(['LEARNING', 'REVIEW', 'RELEARNING']),
	step: v.nullable(v.number()),
	archived: v.boolean(),
	inboxed: v.boolean(),
	due: v.nullable(v.string()),
	parents: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	children: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	reviews: v.optional(v.array(v.lazy(() => ReviewSchema)), [])
})
