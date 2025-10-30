import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { type Todo, TodoSchema } from './schemas'

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
	return v.parse(TodoSchema, data)
}
