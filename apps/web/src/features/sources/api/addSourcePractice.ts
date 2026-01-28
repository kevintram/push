import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export type AddSourcePracticeInput = {
	sourceId: number
	practiceId: number
}

export async function addSourcePractice(
	input: AddSourcePracticeInput
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${input.sourceId}/practices/`,
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

export function useAddSourcePractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: addSourcePractice,
		onSuccess: async (_, input) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: sourceKeys.byId(input.sourceId)
				}),
				queryClient.invalidateQueries({
					queryKey: practiceKeys.byId(input.practiceId)
				})
			])
		}
	})
}
