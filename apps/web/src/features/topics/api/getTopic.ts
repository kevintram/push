import * as v from 'valibot'
import { TodoSchema } from '~/features/todos/api/schemas'
import { apiFetch } from '~/utils/apiFetch'

const TopicSchema = v.object({
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

const TopicWithRelationshipsAndTodosSchema = v.object({
	id: v.number(),
	name: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	stability: v.number(),
	retrievability: v.number(),
	archived: v.boolean(),
	inboxed: v.boolean(),
	parents: v.array(TopicSchema),
	children: v.array(TopicSchema),
	todos: v.array(TodoSchema)
})

export type TopicWithRelationshipsAndTodos = v.InferOutput<
	typeof TopicWithRelationshipsAndTodosSchema
>

export async function getTopic(topicId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/`,
		{
			method: 'GET'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(TopicWithRelationshipsAndTodosSchema, data)
}
