import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import {
	invalidateTopicDetailQueries,
	topicKeys
} from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { AddPracticeTopicInput } from '../types/api.types'
import { PracticeTopicResponseSchema } from '../types/practice.schemas'
import type { PracticeTopicResponse } from '../types/practice.types'
import { invalidatePracticeDetailQueries } from './queryKeys'

export async function addPracticeTopic(
	input: AddPracticeTopicInput
): Promise<PracticeTopicResponse> {
	const body =
		'topicId' in input
			? { topic_id: input.topicId }
			: {
					topic: {
						name: input.topic.name,
						notes: input.topic.notes,
						archived: input.topic.archived,
						inboxed: input.topic.inboxed,
						srs_enabled: input.topic.srs_enabled,
						inherit_fsrs: input.topic.inherit_fsrs
					}
				}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${input.practiceId}/topics/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(PracticeTopicResponseSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useAddPracticeTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: addPracticeTopic,
		onSuccess: async (_, input) => {
			const topicId = 'topicId' in input ? input.topicId : undefined
			await Promise.all([
				invalidatePracticeDetailQueries(queryClient, input.practiceId),
				topicId
					? invalidateTopicDetailQueries(queryClient, topicId)
					: queryClient.invalidateQueries({
							queryKey: topicKeys.all
						})
			])
		}
	})
}
