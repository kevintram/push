import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { TopicSchema } from './schemas'

type UpdateTopicInput = {
	id: number
	name?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
}

export async function updateTopic(input: UpdateTopicInput) {
	const { id, ...updateData } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${id}/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updateData)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(TopicSchema, data)
}
