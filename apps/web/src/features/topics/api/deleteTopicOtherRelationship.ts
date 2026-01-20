import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export async function deleteTopicOtherRelationship(
	fromTopicId: number,
	toTopicId: number
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${fromTopicId}/related/${toTopicId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useDeleteTopicOtherRelationship() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			fromTopicId,
			toTopicId
		}: {
			fromTopicId: number
			toTopicId: number
		}) => deleteTopicOtherRelationship(fromTopicId, toTopicId),
		onSuccess: async (_data, variables) => {
			const fromTopicId = variables.fromTopicId
			const toTopicId = variables.toTopicId

			// Invalidate the detail queries so the single getTopic fetch refreshes with updated relationships
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: topicKeys.detail(fromTopicId)
				}),
				queryClient.invalidateQueries({
					queryKey: topicKeys.detail(toTopicId)
				})
			])
		}
	})
}
