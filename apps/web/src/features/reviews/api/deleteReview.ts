import { useMutation, useQueryClient } from '@tanstack/react-query'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'

export async function deleteReview(id: number): Promise<void> {
	await apiFetch(`${import.meta.env.VITE_API_URL}/reviews/${id}`, {
		method: 'DELETE'
	})
}

export function useDeleteReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteReview,
		onSuccess: (_, reviewId) => {
			// Invalidate all review queries except the byId query for the deleted review
			queryClient.invalidateQueries({
				predicate: query => {
					const queryKey = query.queryKey
					// Check if it's a review query
					if (queryKey[0] !== 'reviews') return false

					// Don't invalidate the byId query for the deleted review
					// byId structure: ['reviews', reviewId, ...]
					if (queryKey.length >= 2 && queryKey[1] === reviewId) {
						return false
					}

					return true
				}
			})

			queryClient.invalidateQueries({
				queryKey: topicKeys.all
			})
		}
	})
}
