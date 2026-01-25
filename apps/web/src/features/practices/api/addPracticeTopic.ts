import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { AddPracticeTopicInput } from '../types/api.types'
import { PracticeTopicResponseSchema } from '../types/practice.schemas'
import type { PracticeTopicResponse } from '../types/practice.types'
import { practiceKeys } from './queryKeys'

export async function addPracticeTopic(
	input: AddPracticeTopicInput
): Promise<PracticeTopicResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${input.practiceId}/topics/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ topic_id: input.topicId })
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
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: practiceKeys.byId(input.practiceId)
				}),
				queryClient.invalidateQueries({
					queryKey: topicKeys.byId(input.topicId)
				})
			])
		}
	})
}
