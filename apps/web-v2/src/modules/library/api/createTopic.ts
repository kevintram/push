import { useMutation, useQueryClient } from '@tanstack/react-query'

import { mutationScopes, optimisticMutationKeys } from '~/lib/mutationConfig'
import { invalidateAfterOptimisticBatch } from '~/lib/optimisticInvalidation'
import { apiFetch } from '~/utils/apiFetch'

import { TopicSchema } from '../types/topic.schemas'
import type { Topic } from '../types/topic.types'
import { topicQueries } from './queries'

export type CreateTopicInput = {
	parentId?: string
}

export async function createTopic({
	parentId,
}: CreateTopicInput = {}): Promise<Topic> {
	return apiFetch(TopicSchema, '/topics/', {
		method: 'POST',
		body: parentId === undefined ? {} : { parent_id: Number(parentId) },
	})
}

export function useCreateTopic() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: [...optimisticMutationKeys.topics, 'create'],
		scope: mutationScopes.topics,
		mutationFn: createTopic,
		meta: { errorMessage: 'Failed to create topic' },
		onSuccess: topic => {
			queryClient.setQueryData(
				topicQueries.detail(topic.id).queryKey,
				topic,
			)
		},
		onSettled: () =>
			invalidateAfterOptimisticBatch(queryClient, [topicQueries.lists()]),
	})
}
