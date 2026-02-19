import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidatePracticeDetailQueries } from '~/features/practices/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicDetailQueries } from './queryKeys'

export type RemoveTopicPracticeInput = {
	topicId: number
	practiceId: number
}

export async function removeTopicPractice(
	input: RemoveTopicPracticeInput
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.topicId}/practices/${input.practiceId}/`,
		{ method: 'DELETE' }
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useRemoveTopicPractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: removeTopicPractice,
		onSuccess: async (_, input) => {
			await Promise.all([
				invalidateTopicDetailQueries(queryClient, input.topicId),
				invalidatePracticeDetailQueries(queryClient, input.practiceId)
			])
		}
	})
}
