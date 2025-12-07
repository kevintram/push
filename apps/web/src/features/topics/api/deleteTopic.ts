import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

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
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})
}
