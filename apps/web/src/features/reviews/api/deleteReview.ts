import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

export async function deleteReview(id: number): Promise<void> {
	await apiFetch(`${import.meta.env.VITE_API_URL}/reviews/${id}`, {
		method: 'DELETE'
	})
}

export function useDeleteReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteReview,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})
}
