import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { type Todo, TodoSchema } from './schemas'

export async function removeTopicFromTodo(
	todoId: number,
	topicId: number
): Promise<Todo> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/todos/${todoId}/topics/${topicId}/`,
		{
			method: 'DELETE'
		}
	)
	const data = await response.json()
	return v.parse(TodoSchema, data)
}
