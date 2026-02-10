import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { SourceSchemaBase } from '~/features/sources/types/source.schemas'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export async function getTopicSources(topicId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/sources/`,
		{
			method: 'GET'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(SourceSchemaBase), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useTopicSources(
	topicId: number | undefined,
	options?: {
		enabled?: boolean
	}
) {
	return useQuery({
		queryKey: topicKeys.sources(topicId!),
		queryFn: () => {
			if (!topicId) throw new Error('Topic ID is required')
			return getTopicSources(topicId)
		},
		enabled: topicId !== undefined && (options?.enabled ?? true)
	})
}
