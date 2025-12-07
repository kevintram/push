import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

export async function deleteTopicReview(id: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topic-reviews/${id}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	return response.json()
}

export function useDeleteTopicReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteTopicReview,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})
}
