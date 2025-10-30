import * as v from 'valibot'
import { type Todo, TodoSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

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
