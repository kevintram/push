import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { TopicSchema } from '../types/topic.schemas'
import { type Topic } from '../types/topic.types'
import { topicKeys } from './queryKeys'

type CreateTopicPayload = {
	title?: string
	body?: string
	parentId?: number | null
}

async function createTopic(payload: CreateTopicPayload): Promise<Topic> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/topics/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

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

export function useCreateTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createTopic,
		onSuccess: topic => {
			queryClient.setQueryData(topicKeys.detail(topic.id), topic)
			return queryClient.invalidateQueries({ queryKey: topicKeys.all })
		},
	})
}
