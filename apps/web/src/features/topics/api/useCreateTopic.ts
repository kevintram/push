import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { type Topic, TopicSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type CreateTopicInput = {
	name?: string
	notes?: string
	stability?: number | null
	difficulty?: number | null
	state?: 'LEARNING' | 'REVIEW' | 'RELEARNING'
	retrievability?: number
	archived?: boolean
	inboxed?: boolean
}

async function createTopic(input: CreateTopicInput = {}): Promise<Topic> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/topics/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: input.name ?? '',
			notes: input.notes ?? '',
			stability: input.stability ?? 1,
			difficulty: input.difficulty ?? null,
			state: input.state ?? 'LEARNING',
			retrievability: input.retrievability ?? 0.0,
			archived: input.archived ?? false,
			inboxed: input.inboxed ?? false
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
		onSuccess: () => {
			// Invalidate all topics queries to trigger refetch
			queryClient.invalidateQueries({ queryKey: ['topics'] })
		}
	})
}
