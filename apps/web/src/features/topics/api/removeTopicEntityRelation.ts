import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EntityType } from '~/models/entity-relations.types'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicDetailQueries } from './queryKeys'

export async function removeTopicEntityRelation(
	topicId: number,
	entityType: EntityType,
	entityId: number
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/entity-relations/${entityType}/${entityId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useRemoveTopicEntityRelation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			topicId,
			entityType,
			entityId
		}: {
			topicId: number
			entityType: EntityType
			entityId: number
		}) => removeTopicEntityRelation(topicId, entityType, entityId),
		onSuccess: async (_data, variables) => {
			await invalidateTopicDetailQueries(queryClient, variables.topicId)
		}
	})
}
