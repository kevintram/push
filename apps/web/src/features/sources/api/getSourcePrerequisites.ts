import { useQuery } from '@tanstack/react-query'
import type { SourcePrerequisiteRead } from '~/models/entity-relations.types'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export async function getSourcePrerequisites(
	sourceId: number
): Promise<Array<SourcePrerequisiteRead>> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/prerequisites/`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	return response.json()
}

export function useSourcePrerequisites(sourceId: number | undefined) {
	return useQuery({
		queryKey: sourceKeys.prerequisites(sourceId ?? 0),
		queryFn: () => getSourcePrerequisites(sourceId!),
		enabled: sourceId !== undefined
	})
}
