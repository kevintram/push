import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EntityType } from '~/models/entity-relations.types'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateSourceDetailQueries } from './queryKeys'

export async function removeSourceEntityRelation(
	sourceId: number,
	entityType: EntityType,
	entityId: number
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/entity-relations/${entityType}/${entityId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useRemoveSourceEntityRelation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			sourceId,
			entityType,
			entityId
		}: {
			sourceId: number
			entityType: EntityType
			entityId: number
		}) => removeSourceEntityRelation(sourceId, entityType, entityId),
		onSuccess: async (_data, variables) => {
			await invalidateSourceDetailQueries(queryClient, variables.sourceId)
		}
	})
}
