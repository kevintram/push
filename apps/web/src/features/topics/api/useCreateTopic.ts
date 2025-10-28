import { useMutation } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { TopicWithTodosSchema, type TopicWithTodos } from '~/features/todos/api/schemas'

type CreateTopicInput = {
	name?: string
	notes?: string
	stability?: number
	retrievability?: number
	is_archived?: boolean
	is_inboxed?: boolean
}

async function createTopic(input: CreateTopicInput = {}): Promise<TopicWithTodos> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/topics/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: input.name ?? '',
			notes: input.notes ?? '',
			stability: input.stability ?? 1,
			retrievability: input.retrievability ?? 0.0,
			is_archived: input.is_archived ?? false,
			is_inboxed: input.is_inboxed ?? false
		})
	})
	const data = await response.json()
	return v.parse(TopicWithTodosSchema, data)
}

export function useCreateTopic() {
	return useMutation({
		mutationFn: createTopic
	})
}
