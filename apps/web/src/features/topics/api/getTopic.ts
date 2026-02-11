import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { TopicSchema } from '../types/topic.schemas'
import { topicKeys } from './queryKeys'

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
	try {
		return v.parse(TopicSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useTopicWithRelationships(topicId: number | undefined) {
	const { data: topic, isLoading } = useQuery({
		queryKey: topicKeys.detail(topicId!),
		queryFn: () => getTopic(topicId!),
		enabled: topicId !== undefined
	})

	return { topic, isLoading }
}
