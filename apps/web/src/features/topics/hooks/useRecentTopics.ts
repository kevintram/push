import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { type Topic, TopicSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

async function fetchRecentTopics(): Promise<Array<Topic>> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/?order=desc&limit=50`
	)

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

export function useRecentTopics() {
	return useQuery({
		queryKey: ['topics', 'recent'],
		queryFn: fetchRecentTopics
	})
}
