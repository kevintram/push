import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SourcePrerequisiteCreate } from '~/models/entity-relations.types'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export async function addSourcePrerequisite(
	sourceId: number,
	data: SourcePrerequisiteCreate
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/prerequisites/`,
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

export function useAddSourcePrerequisite() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			sourceId,
			data
		}: {
			sourceId: number
			data: SourcePrerequisiteCreate
		}) => addSourcePrerequisite(sourceId, data),
		onSuccess: async (_data, variables) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: sourceKeys.prerequisites(variables.sourceId)
				}),
				queryClient.invalidateQueries({
					queryKey: sourceKeys.byId(variables.sourceId)
				})
			])
		}
	})
}
