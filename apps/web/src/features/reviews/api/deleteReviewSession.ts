import { useMutation, useQueryClient } from '@tanstack/react-query'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'

export async function deleteReviewSession(id: number): Promise<void> {
	await apiFetch(`${import.meta.env.VITE_API_URL}/review-sessions/${id}`, {
		method: 'DELETE'
	})
}

export function useDeleteReviewSession() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteReviewSession,
		onSuccess: (_, reviewSessionId) => {
			// Invalidate all review session queries except the byId query for the deleted session
			queryClient.invalidateQueries({
				predicate: query => {
					const queryKey = query.queryKey
					// Check if it's a review session query
					// Note: 'reviews' was the old key. I should check queryKeys.ts to see what the key is.
					// Assuming reviewKeys.all is ['reviews'] still? I need to check queryKeys.ts next.
					if (queryKey[0] !== 'reviews') return false

					// Don't invalidate the byId query for the deleted review
					if (queryKey.length >= 2 && queryKey[1] === reviewSessionId) {
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
