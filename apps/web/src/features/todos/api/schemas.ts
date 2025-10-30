import * as v from 'valibot'

export const TopicSchema = v.object({
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

export const TodoSchema = v.object({
	id: v.number(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),
	inserted_at: v.string(),
	updated_at: v.string(),
	description: v.string(),
	topics: v.optional(v.array(TopicSchema), [])
})

export const TopicWithTodosSchema = v.object({
	id: v.number(),
	name: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	stability: v.number(),
	retrievability: v.number(),
	archived: v.boolean(),
	inboxed: v.boolean(),
	todos: v.array(v.lazy(() => TodoSchema))
})

export const TodosResponseSchema = v.array(TodoSchema)

export type Topic = v.InferOutput<typeof TopicSchema>
export type TopicWithTodos = v.InferOutput<typeof TopicWithTodosSchema>
export type Todo = v.InferOutput<typeof TodoSchema>
