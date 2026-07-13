import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { TopicSchema } from '../types/topic.schemas'
import type { Topic } from '../types/topic.types'
import { topicQueries } from './queries'

export type UpdateTopicInput = {
	id: number | string
	title?: string
	body?: string
}

export async function updateTopic({
	id,
	...updates
}: UpdateTopicInput): Promise<Topic> {
	const url = new URL(import.meta.env.VITE_API_URL + `/topics/${id}/`)
	const response = await fetch(url, {
		method: 'PATCH',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updates),
	})
	if (!response.ok) {
		throw new Error(`Failed to update topic ${id}: ${response.status}`)
	}
	return v.parse(TopicSchema, await response.json())
}

export function useUpdateTopic() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: updateTopic,
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
