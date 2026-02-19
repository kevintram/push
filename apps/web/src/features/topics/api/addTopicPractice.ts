import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import {
	invalidatePracticeDetailQueries,
	practiceKeys
} from '~/features/practices/api/queryKeys'
import { PracticeSchema } from '~/features/practices/types/practice.schemas'
import type { Practice } from '~/features/practices/types/practice.types'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicDetailQueries } from './queryKeys'

export type AddTopicPracticeInput =
	| {
			topicId: number
			practiceId: number
	  }
	| {
			topicId: number
			practice: {
				prompt: string
				answer: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
				inherit_fsrs?: boolean
			}
	  }

export async function addTopicPractice(
	input: AddTopicPracticeInput
): Promise<Practice> {
	const body =
		'practiceId' in input
			? { practice_id: input.practiceId }
			: {
					practice: {
						prompt: input.practice.prompt,
						answer: input.practice.answer,
						archived: input.practice.archived,
						inboxed: input.practice.inboxed,
						srs_enabled: input.practice.srs_enabled,
						inherit_fsrs: input.practice.inherit_fsrs
					}
				}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.topicId}/practices/`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(PracticeSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useAddTopicPractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: addTopicPractice,
		onSuccess: async (practice, input) => {
			const practiceId = 'practiceId' in input ? input.practiceId : practice.id
			await Promise.all([
				invalidateTopicDetailQueries(queryClient, input.topicId),
				invalidatePracticeDetailQueries(queryClient, practiceId),
				queryClient.invalidateQueries({
					queryKey: practiceKeys.all
				})
			])
		}
	})
}
