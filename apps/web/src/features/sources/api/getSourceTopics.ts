import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { TopicSchemaBase } from '~/features/topics/types/topic.schemas'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export async function getSourceTopics(sourceId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/topics/`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(TopicSchemaBase), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useSourceTopics(
	sourceId: number | undefined,
	options?: {
		enabled?: boolean
	}
) {
	return useQuery({
		queryKey: sourceKeys.topics(sourceId ?? 0),
		queryFn: () => {
			if (!sourceId) throw new Error('Source ID is required')
			return getSourceTopics(sourceId)
		},
		enabled: sourceId !== undefined && (options?.enabled ?? true)
	})
}
