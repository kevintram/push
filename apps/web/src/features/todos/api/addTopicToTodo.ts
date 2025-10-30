import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { type Todo, TodoSchema } from './schemas'

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
	return v.parse(TodoSchema, data)
}
