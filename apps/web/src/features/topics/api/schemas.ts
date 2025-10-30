import * as v from 'valibot'
import type { Todo } from '~/features/todos/api/schemas'
import { TodoSchema } from '~/features/todos/api/schemas'
import type { Topic } from '~/types/topics.types'

const topicFieldValidators = () => ({
	id: v.number(),
	name: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	stability: v.number(),
	retrievability: v.number(),
	archived: v.boolean(),
	inboxed: v.boolean()
})

// Base topic schema matching the API response from /topics/ endpoint
export const TopicSchema = v.object(topicFieldValidators())

// Summaries used for parent/child arrays (no nested relationships)
const TopicSummarySchema = v.object(topicFieldValidators())

export const TopicWithRelationshipsSchema = v.object({
	...topicFieldValidators(),
	parents: v.array(TopicSummarySchema),
	children: v.array(TopicSummarySchema)
})

export const TopicWithRelationshipsAndTodosSchema = v.object({
	...topicFieldValidators(),
	parents: v.array(TopicSummarySchema),
	children: v.array(TopicSummarySchema),
	todos: v.optional(v.array(TodoSchema), [])
})

type TopicWithRelationshipsRaw = v.InferOutput<
	typeof TopicWithRelationshipsSchema
>

type TopicWithRelationshipsAndTodosRaw = v.InferOutput<
	typeof TopicWithRelationshipsAndTodosSchema
>

export type TopicWithRelationships = TopicWithRelationshipsRaw &
	Topic & {
		parents: Array<Topic>
		children: Array<Topic>
	}

export type TopicWithRelationshipsAndTodos = TopicWithRelationshipsAndTodosRaw &
	Topic & {
		parents: Array<Topic>
		children: Array<Topic>
		todos: Array<Todo>
	}
