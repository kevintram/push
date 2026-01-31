import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export type AddSourcePracticeInput =
	| {
			sourceId: number
			practiceId: number
	  }
	| {
			sourceId: number
			practice: {
				prompt: string
				answer: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
			}
	  }

export async function addSourcePractice(
	input: AddSourcePracticeInput
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
		`${import.meta.env.VITE_API_URL}/sources/${input.sourceId}/practices/`,
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

export function useAddSourcePractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: addSourcePractice,
		onSuccess: async (_, input) => {
			const practiceId = 'practiceId' in input ? input.practiceId : undefined
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: sourceKeys.byId(input.sourceId)
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
