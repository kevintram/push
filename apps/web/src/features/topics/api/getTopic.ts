import * as v from 'valibot'
import { TopicSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

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
	return v.parse(TopicSchema, data)
}
