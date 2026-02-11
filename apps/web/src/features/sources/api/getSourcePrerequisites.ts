import { useQuery } from '@tanstack/react-query'
import type { RelatedEntityItem } from '~/features/topics/types/topic.types'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export async function getSourcePrerequisites(
	sourceId: number
): Promise<Array<RelatedEntityItem>> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/prerequisites/`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	return response.json()
}

export function useSourcePrerequisites(
	sourceId: number | undefined,
	options?: {
		enabled?: boolean
	}
) {
	return useQuery({
		queryKey: sourceKeys.prerequisites(sourceId ?? 0),
		queryFn: () => getSourcePrerequisites(sourceId!),
		enabled: sourceId !== undefined && (options?.enabled ?? true)
	})
}
