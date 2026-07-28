import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '~/utils/apiFetch'

import { TopicSchema } from '../types/topic.schemas'
import type { Topic } from '../types/topic.types'
import { topicQueries } from './queries'

export type UpdateTopicInput = {
	id: string
	title?: string
	body?: string
}

export async function updateTopic({
	id,
	...updates
}: UpdateTopicInput): Promise<Topic> {
	return apiFetch(TopicSchema, `/topics/${id}/`, {
		method: 'PATCH',
		body: updates,
	})
}

export function useUpdateTopic() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: updateTopic,
		meta: { errorMessage: 'Failed to update topic' },
		onSuccess: topic => {
			queryClient.setQueryData(
				topicQueries.detail(topic.id).queryKey,
				topic,
			)
			void queryClient.invalidateQueries({
				queryKey: topicQueries.lists(),
			})
		},
	})
}
