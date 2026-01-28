import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addSourceTopic } from '~/features/sources/api/addSourceTopic'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { topicKeys } from './queryKeys'

type AddTopicSourceParams = {
	topicId: number
	sourceId: number
}

export function useAddTopicSource() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ topicId, sourceId }: AddTopicSourceParams) => {
			// The API is on the source side: POST /sources/{sourceId}/topics/
			return addSourceTopic(sourceId, { topic_id: topicId })
		},
		onSuccess: async (_, variables) => {
			// Invalidate both the topic and source detail queries
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: topicKeys.detail(variables.topicId)
				}),
				queryClient.invalidateQueries({
					queryKey: sourceKeys.detail(variables.sourceId)
				})
			])
		}
	})
}
