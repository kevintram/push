import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { practiceKeys } from './queryKeys'

export type DeletePracticeInput = {
	practiceId: number
}

export async function deletePractice(input: DeletePracticeInput | number) {
	const practiceId = typeof input === 'number' ? input : input.practiceId

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${practiceId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useDeletePractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deletePractice,
		onSuccess: (_, input) => {
			const practiceId = typeof input === 'number' ? input : input.practiceId
			// Invalidate all practice queries except the byId query for the deleted practice
			queryClient.invalidateQueries({
				predicate: query => {
					const queryKey = query.queryKey
					// Check if it's a practice query
					if (queryKey[0] !== 'practices') return false

					// Don't invalidate the byId query for the deleted practice
					// byId structure: ['practices', practiceId, ...]
					if (queryKey.length >= 2 && queryKey[1] === practiceId) {
						return false
					}

					return true
				}
			})
			queryClient.invalidateQueries({
				queryKey: reviewKeys.all
			})
		}
	})
}
