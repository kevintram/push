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
	try {
		return v.parse(TodoSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}
