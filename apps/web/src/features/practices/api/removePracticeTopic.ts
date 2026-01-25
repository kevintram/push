import { useMutation, useQueryClient } from '@tanstack/react-query'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { RemovePracticeTopicInput } from '../types/api.types'
import { practiceKeys } from './queryKeys'

export async function removePracticeTopic(
	input: RemovePracticeTopicInput
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${input.practiceId}/topics/${input.topicId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useRemovePracticeTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: removePracticeTopic,
		onSuccess: async (_, input) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: practiceKeys.byId(input.practiceId)
				}),
				queryClient.invalidateQueries({
					queryKey: topicKeys.byId(input.topicId)
				})
			])
		}
	})
}
