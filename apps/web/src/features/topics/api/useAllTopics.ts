import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { type Topic, TopicSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

async function fetchAllTopics(): Promise<Array<Topic>> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/topics/`)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(TopicSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useAllTopics() {
	return useQuery({
		queryKey: ['topics', 'all'],
		queryFn: fetchAllTopics
	})
}
