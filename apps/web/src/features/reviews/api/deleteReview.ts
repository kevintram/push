import { useMutation, useQueryClient } from '@tanstack/react-query'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { reviewKeys } from './queryKeys'

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
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			])
		}
	})
}
