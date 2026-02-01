import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export type AddTopicPracticeInput =
	| {
			topicId: number
			practiceId: number
	  }
	| {
			topicId: number
			practice: {
				prompt: string
				answer: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
			}
	  }

export async function addTopicPractice(
	input: AddTopicPracticeInput
): Promise<void> {
	const body =
		'practiceId' in input
			? { practice_id: input.practiceId }
			: {
					practice: {
						prompt: input.practice.prompt,
						answer: input.practice.answer,
						archived: input.practice.archived,
						inboxed: input.practice.inboxed,
						srs_enabled: input.practice.srs_enabled
					}
				}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.topicId}/practices/`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
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
			const practiceId = 'practiceId' in input ? input.practiceId : undefined
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: topicKeys.byId(input.topicId)
				}),
				practiceId
					? queryClient.invalidateQueries({
							queryKey: practiceKeys.byId(practiceId)
						})
					: queryClient.invalidateQueries({
							queryKey: practiceKeys.all
						})
			])
		}
	})
}
