import { useMutation, useQueryClient } from '@tanstack/react-query'
import { topicKeys } from '~/features/topics/api/queryKeys'
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

	return response.json()
}

export function useDeleteReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteReview,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			])
		}
	})
}
