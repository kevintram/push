import { useMutation, useQueryClient } from '@tanstack/react-query'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export async function removeSourceTopic(
	sourceId: number,
	topicId: number
): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/topics/${topicId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useRemoveSourceTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			sourceId,
			topicId
		}: {
			sourceId: number
			topicId: number
		}) => removeSourceTopic(sourceId, topicId),
		onSuccess: async (_data, variables) => {
			const { sourceId, topicId } = variables

			// Invalidate source detail so the topics list refreshes
			// Also invalidate topic detail so the sources list refreshes
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: sourceKeys.byId(sourceId)
				}),
				queryClient.invalidateQueries({
					queryKey: topicKeys.byId(topicId)
				})
			])
		}
	})
}
