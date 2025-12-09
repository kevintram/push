import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'

export async function deleteTopic(topicId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useDeleteTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteTopic,
		onSuccess: (_, topicId) => {
			// Invalidate all topic queries except the byId query for the deleted topic
			queryClient.invalidateQueries({
				predicate: query => {
					const queryKey = query.queryKey
					// Check if it's a topic query
					if (queryKey[0] !== 'topics') return false

					// Don't invalidate the byId query for the deleted topic
					// byId structure: ['topics', topicId, ...]
					if (queryKey.length >= 2 && queryKey[1] === topicId) {
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
