import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { TopicSchema } from '../types/topic.types'
import { topicKeys } from './queryKeys'

export async function getTopicParents(topicId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/parents/`,
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

export function useTopicParents(topicId: number | undefined) {
	return useQuery({
		queryKey: topicKeys.parents(topicId!),
		queryFn: () => {
			if (!topicId) throw new Error('Topic ID is required')
			return getTopicParents(topicId)
		},
		enabled: topicId !== undefined
	})
}
