import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EntityRelationCreate } from '~/models/entity-relations.types'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export async function addSourceEntityRelation(
	sourceId: number,
	data: EntityRelationCreate
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/entity-relations/`,
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

export function useAddSourceEntityRelation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			sourceId,
			data
		}: {
			sourceId: number
			data: EntityRelationCreate
		}) => addSourceEntityRelation(sourceId, data),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: sourceKeys.byId(variables.sourceId)
			})
		}
	})
}
