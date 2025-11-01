import * as v from 'valibot'
import { type Todo, TodoSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export async function addTopicToTodo(
	todoId: number,
	topicId: number
): Promise<Todo> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/todos/${todoId}/topics/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				topic_id: topicId
			})
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
