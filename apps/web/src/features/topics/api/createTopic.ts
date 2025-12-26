import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { CreateTopicInput } from '../types/api.types'
import { TopicSchema } from '../types/topic.schemas'
import type { Topic } from '../types/topic.types'
import { topicKeys } from './queryKeys'

export async function createTopic(
	input: CreateTopicInput = {}
): Promise<Topic> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/topics/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: input.name ?? '',
			notes: input.notes ?? '',
			stability:
				input.stability ?? Number(import.meta.env.VITE_FSRS_INITIAL_STABILITY),
			inherited_stability: input.inherited_stability ?? null,
			inherited_difficulty: input.inherited_difficulty ?? null,
			inherited_state: input.inherited_state ?? null,
			inherited_last_review: input.inherited_last_review ?? null,
			difficulty:
				input.difficulty ??
				Number(import.meta.env.VITE_FSRS_INITIAL_DIFFICULTY),
			state:
				input.state ??
				(import.meta.env.VITE_FSRS_INITIAL_STATE as
					| 'LEARNING'
					| 'REVIEW'
					| 'RELEARNING'),
			archived: input.archived ?? false,
			inboxed: input.inboxed ?? false,
			srs_enabled: input.srs_enabled ?? true
		})
	})

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
		onSuccess: async () => {
			// Invalidate topic and review queries to reflect the new topic
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			])
		}
	})
}
