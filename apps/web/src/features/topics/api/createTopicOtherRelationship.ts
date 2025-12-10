import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { TopicOtherRelationshipResponseSchema } from '../types/topic.schemas'
import type { TopicOtherRelationshipResponse } from '../types/topic.types'
import { topicKeys } from './queryKeys'

export async function createTopicOtherRelationship(
	fromTopicId: number,
	toTopicId: number
): Promise<TopicOtherRelationshipResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${fromTopicId}/related/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ to_topic_id: toTopicId })
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicOtherRelationshipResponseSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useCreateTopicOtherRelationship() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			fromTopicId,
			toTopicId
		}: {
			fromTopicId: number
			toTopicId: number
		}) => createTopicOtherRelationship(fromTopicId, toTopicId),
		onSuccess: async data => {
			const fromTopicId = data.from_topic.id
			const toTopicId = data.to_topic.id

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: topicKeys.related(fromTopicId)
				}),
				queryClient.invalidateQueries({
					queryKey: topicKeys.related(toTopicId)
				})
			])
		}
	})
}
