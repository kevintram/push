import * as v from 'valibot'
import { type Todo, TodoSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export type UpdateTodoInput = {
	id: number
	description?: string
	scheduled_at?: string | null
	completed_at?: string | null
}

export async function updateTodo(input: UpdateTodoInput): Promise<Todo> {
	const { id, ...updateData } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/todos/${id}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id,
				...updateData
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
