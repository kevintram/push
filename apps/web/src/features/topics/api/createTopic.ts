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
			archived: input.archived ?? false,
			inboxed: input.inboxed ?? false,
			parent_id: input.parent_id ?? null,
			srs_enabled: input.srs_enabled ?? true,
			inherit_fsrs: input.inherit_fsrs ?? false
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
