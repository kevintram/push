import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EntityRelationCreate } from '~/models/entity-relations.types'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export async function addTopicEntityRelation(
	topicId: number,
	data: EntityRelationCreate
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/entity-relations/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useAddTopicEntityRelation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			topicId,
			data
		}: {
			topicId: number
			data: EntityRelationCreate
		}) => addTopicEntityRelation(topicId, data),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: topicKeys.detail(variables.topicId)
			})
		}
	})
}
