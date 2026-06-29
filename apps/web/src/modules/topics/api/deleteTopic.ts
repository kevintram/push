import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reviewCardKeys } from '~/modules/review-cards/api/queryKeys'
import { reviewKeys, reviewQueueKeys } from '~/modules/reviews/api/queryKeys'
import { searchKeys } from '~/modules/search/api/searchAll'
import { apiFetch } from '~/utils/apiFetch'

import { topicKeys } from './queryKeys'

async function deleteTopic(topicId: number): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/`,
		{
			method: 'DELETE',
		},
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useDeleteTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteTopic,
		onSuccess: async (_, topicId) => {
			queryClient.removeQueries({
				queryKey: topicKeys.detail(topicId),
			})

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewCardKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
				queryClient.invalidateQueries({
					queryKey: reviewQueueKeys.all,
				}),
				queryClient.invalidateQueries({ queryKey: searchKeys.all }),
			])
		},
	})
}
