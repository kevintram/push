import * as v from 'valibot'

export type LearningState = 'LEARNING' | 'REVIEW' | 'RELEARNING'

export type Todo = {
	id: number
	scheduled_at: string | null
	completed_at: string | null
	effective_date: string | null
	inserted_at: string
	updated_at: string
	description: string
	topics?: Array<Topic>
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
	archived: boolean
	inboxed: boolean
	parents?: Array<Topic>
	children?: Array<Topic>
	todos?: Array<Todo>
}

export const TodoSchema: v.GenericSchema<Todo> = v.object({
	id: v.number(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),
	inserted_at: v.string(),
	updated_at: v.string(),
	description: v.string(),
	topics: v.optional(v.array(v.lazy(() => TopicSchema)), [])
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
	archived: v.boolean(),
	inboxed: v.boolean(),
	parents: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	children: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	todos: v.optional(v.array(v.lazy(() => TodoSchema)), [])
})
