import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { TopicSchema } from '../types/topic.schemas'
import type { Topic } from '../types/topic.types'
import { topicQueries } from './queries'

export type CreateTopicInput = {
	parentId?: number
}

export async function createTopic({
	parentId,
}: CreateTopicInput = {}): Promise<Topic> {
	const url = new URL(import.meta.env.VITE_API_URL + '/topics/')
	const response = await fetch(url, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(
			parentId === undefined ? {} : { parent_id: parentId },
		),
	})
	if (!response.ok) {
		throw new Error(`Failed to create topic: ${response.status}`)
	}
	return v.parse(TopicSchema, await response.json())
}

export function useCreateTopic() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createTopic,
		onSuccess: topic => {
			queryClient.setQueryData(
				topicQueries.detail(String(topic.id)).queryKey,
				topic,
			)
			void queryClient.invalidateQueries({
				queryKey: topicQueries.lists(),
			})
		},
	})
}
