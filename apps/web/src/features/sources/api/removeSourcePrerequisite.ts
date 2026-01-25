import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EntityType } from '~/models/entity-relations.types'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export async function removeSourcePrerequisite(
	sourceId: number,
	entityType: EntityType,
	entityId: number
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/prerequisites/${entityType}/${entityId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useRemoveSourcePrerequisite() {
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
		}) => removeSourcePrerequisite(sourceId, entityType, entityId),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: sourceKeys.prerequisites(variables.sourceId)
			})
		}
	})
}
