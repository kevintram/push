import * as v from 'valibot'
import { TodoSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type GetTodosFilters = {
	topicId?: number
}

export async function getTodos(filters?: GetTodosFilters) {
	const params = new URLSearchParams()

	if (filters?.topicId !== undefined) {
		params.append('topic_id', filters.topicId.toString())
	}

	const url = `${import.meta.env.VITE_API_URL}/todos/${params.toString() ? `?${params.toString()}` : ''}`

	const response = await apiFetch(url, {
		method: 'GET'
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(v.array(TodoSchema), data)
}
