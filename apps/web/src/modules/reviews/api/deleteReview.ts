import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewCardKeys } from '~/modules/review-cards/api/queryKeys'
import { reviewQueueKeys } from '~/modules/reviews/api/queryKeys'
import { searchKeys } from '~/modules/search/api/searchAll'
import { apiFetch } from '~/utils/apiFetch'
import { reviewKeys } from './queryKeys'

export async function deleteReview(id: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/${id}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	if (response.status === 204) {
		return null
	}

	return response.json()
}

type DeleteReviewInvalidationScope = 'all' | 'reviews-only'

type UseDeleteReviewOptions = {
	invalidationScope?: DeleteReviewInvalidationScope
	onDeferredInvalidation?: () => void
}

export function useDeleteReview({
	invalidationScope = 'all',
	onDeferredInvalidation
}: UseDeleteReviewOptions = {}) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteReview,
		onSuccess: async () => {
			if (invalidationScope === 'reviews-only') {
				onDeferredInvalidation?.()
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: reviewCardKeys.all,
						refetchType: 'none'
					}),
					queryClient.invalidateQueries({
						queryKey: reviewKeys.all
					}),
					queryClient.invalidateQueries({
						queryKey: reviewQueueKeys.all,
						refetchType: 'none'
					}),
					queryClient.invalidateQueries({
						queryKey: searchKeys.all,
						refetchType: 'none'
					})
				])
				return
			}

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: reviewCardKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewQueueKeys.all }),
				queryClient.invalidateQueries({ queryKey: searchKeys.all })
			])
		}
	})
}
