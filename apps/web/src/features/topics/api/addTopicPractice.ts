import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export type AddTopicPracticeInput = {
	topicId: number
	practiceId: number
}

export async function addTopicPractice(
	input: AddTopicPracticeInput
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.topicId}/practices/`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ practice_id: input.practiceId })
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useAddTopicPractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: addTopicPractice,
		onSuccess: async (_, input) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: topicKeys.byId(input.topicId)
				}),
				queryClient.invalidateQueries({
					queryKey: practiceKeys.byId(input.practiceId)
				})
			])
		}
	})
}
