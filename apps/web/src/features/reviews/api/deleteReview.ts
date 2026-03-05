import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewCardKeys } from '~/features/review-cards/api/queryKeys'
import { reviewQueueKeys } from '~/features/reviews/api/queryKeys'
import { searchKeys } from '~/features/search/api/searchAll'
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

export function useDeleteReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteReview,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: reviewCardKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewQueueKeys.all }),
				queryClient.invalidateQueries({ queryKey: searchKeys.all })
			])
		}
	})
}
