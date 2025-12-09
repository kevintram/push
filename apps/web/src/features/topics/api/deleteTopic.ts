import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

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
		onSuccess: async (_, variables) => {
			const topicId = variables
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({
					queryKey: reviewKeys.list({ topicId })
				})
			])
		}
	})
}
