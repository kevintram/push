import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { TopicOtherRelationshipResponseSchema } from '../types/topic.schemas'
import type {
	TopicOtherRelationshipCreate,
	TopicOtherRelationshipResponse
} from '../types/topic.types'
import { topicKeys } from './queryKeys'

export async function createTopicOtherRelationship(
	fromTopicId: number,
	data: TopicOtherRelationshipCreate
): Promise<TopicOtherRelationshipResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${fromTopicId}/related/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const responseData = await response.json()
	try {
		return v.parse(TopicOtherRelationshipResponseSchema, responseData)
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
			data
		}: {
			fromTopicId: number
			data: TopicOtherRelationshipCreate
		}) => createTopicOtherRelationship(fromTopicId, data),
		onSuccess: async responseData => {
			const fromTopicId = responseData.from_topic.id
			const toTopicId = responseData.to_topic.id

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
