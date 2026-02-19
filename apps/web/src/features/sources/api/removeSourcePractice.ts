import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidatePracticeDetailQueries } from '~/features/practices/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateSourceDetailQueries } from './queryKeys'

export type RemoveSourcePracticeInput = {
	sourceId: number
	practiceId: number
}

export async function removeSourcePractice(
	input: RemoveSourcePracticeInput
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${input.sourceId}/practices/${input.practiceId}/`,
		{ method: 'DELETE' }
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useRemoveSourcePractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: removeSourcePractice,
		onSuccess: async (_, input) => {
			await Promise.all([
				invalidateSourceDetailQueries(queryClient, input.sourceId),
				invalidatePracticeDetailQueries(queryClient, input.practiceId)
			])
		}
	})
}
