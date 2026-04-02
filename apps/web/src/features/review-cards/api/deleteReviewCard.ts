import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewQueueKeys } from '~/features/reviews/api/queryKeys'
import { searchKeys } from '~/features/search/api/searchAll'
import { apiFetch } from '~/utils/apiFetch'
import { reviewCardKeys } from './queryKeys'

export async function deleteReviewCard(reviewCardId: number): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-cards/${reviewCardId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useDeleteReviewCard() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteReviewCard,
		onSuccess: async (_, reviewCardId) => {
			queryClient.removeQueries({
				queryKey: reviewCardKeys.detail(reviewCardId)
			})
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: reviewCardKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewQueueKeys.all }),
				queryClient.invalidateQueries({ queryKey: searchKeys.all })
			])
		}
	})
}
