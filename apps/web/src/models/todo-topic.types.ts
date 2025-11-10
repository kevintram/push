import * as v from 'valibot'

export type LearningState = 'LEARNING' | 'REVIEW' | 'RELEARNING'
export type Rating = 'miss' | 'hard' | 'good' | 'easy'

export type Review = {
	id: number
	todo_id: number
	topic_id: number
	rating: Rating
	inserted_at: string
	updated_at: string
	topic: Topic

	// Topic FSRS state before review
	topic_stability_before: number | null
	topic_difficulty_before: number | null
	topic_state_before: LearningState | null
	topic_step_before: number | null

	// Topic FSRS state after review
	topic_stability_after: number | null
	topic_difficulty_after: number | null
	topic_state_after: LearningState | null
	topic_step_after: number | null
	topic_due_after: string | null
}

export type Todo = {
	id: number
	scheduled_at: string | null
	completed_at: string | null
	effective_date: string | null
	inserted_at: string
	updated_at: string
	description: string
	topics?: Array<Topic>
	reviews?: Array<Review>
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
	todos?: Array<Todo>
}

export const ReviewSchema: v.GenericSchema<Review> = v.object({
	id: v.number(),
	todo_id: v.number(),
	topic_id: v.number(),
	rating: v.picklist(['miss', 'hard', 'good', 'easy']),
	inserted_at: v.string(),
	updated_at: v.string(),
	topic: v.lazy(() => TopicSchema),

	// Topic FSRS state before review
	topic_stability_before: v.nullable(v.number()),
	topic_difficulty_before: v.nullable(v.number()),
	topic_state_before: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	topic_step_before: v.nullable(v.number()),

	// Topic FSRS state after review
	topic_stability_after: v.nullable(v.number()),
	topic_difficulty_after: v.nullable(v.number()),
	topic_state_after: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	topic_step_after: v.nullable(v.number()),
	topic_due_after: v.nullable(v.string())
})

export const TodoSchema: v.GenericSchema<Todo> = v.object({
	id: v.number(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),
	inserted_at: v.string(),
	updated_at: v.string(),
	description: v.string(),
	topics: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	reviews: v.optional(v.array(v.lazy(() => ReviewSchema)), [])
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
	todos: v.optional(v.array(v.lazy(() => TodoSchema)), [])
})
