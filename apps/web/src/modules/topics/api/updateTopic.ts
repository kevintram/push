import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { TopicSchema } from '../types/topic.schemas'
import type { Topic, UpdateTopicInput } from '../types/topic.types'
import { topicKeys } from './queryKeys'

async function updateTopic(input: UpdateTopicInput): Promise<Topic> {
	const { id, ...payload } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${id}/`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUpdateTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateTopic,
		onSuccess: topic => {
			queryClient.setQueryData(topicKeys.detail(topic.id), topic)
			return queryClient.invalidateQueries({ queryKey: topicKeys.all })
		}
	})
}
