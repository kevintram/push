import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { PracticeSchemaBase } from '~/features/practices/types/practice.schemas'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export async function getTopicPractices(topicId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/practices/`,
		{
			method: 'GET'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(PracticeSchemaBase), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useTopicPractices(
	topicId: number | undefined,
	options?: {
		enabled?: boolean
	}
) {
	return useQuery({
		queryKey: topicKeys.practices(topicId!),
		queryFn: () => {
			if (!topicId) throw new Error('Topic ID is required')
			return getTopicPractices(topicId)
		},
		enabled: topicId !== undefined && (options?.enabled ?? true)
	})
}
