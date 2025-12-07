import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { TopicSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export async function getTopicChildren(topicId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/children/`,
		{
			method: 'GET'
		}
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

export function useTopicChildren(topicId: number | undefined) {
	return useQuery({
		queryKey: ['topics', topicId, 'children'],
		queryFn: () => {
			if (!topicId) throw new Error('Topic ID is required')
			return getTopicChildren(topicId)
		},
		enabled: topicId !== undefined
	})
}
