import * as v from 'valibot'
import { TodoSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type CreateTodoInput = {
	description: string
	scheduledAt?: string | null
	completedAt?: string | null
}

export async function createTodo(input: CreateTodoInput) {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/todos/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			description: input.description,
			scheduled_at: input.scheduledAt,
			completed_at: input.completedAt
		})
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

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
