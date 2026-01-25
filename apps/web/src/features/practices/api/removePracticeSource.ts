import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { RemovePracticeSourceInput } from '../types/api.types'
import { practiceKeys } from './queryKeys'

export async function removePracticeSource(
	input: RemovePracticeSourceInput
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${input.practiceId}/sources/${input.sourceId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useRemovePracticeSource() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: removePracticeSource,
		onSuccess: async (_, input) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: practiceKeys.byId(input.practiceId)
				}),
				queryClient.invalidateQueries({
					queryKey: sourceKeys.byId(input.sourceId)
				})
			])
		}
	})
}
