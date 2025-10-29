import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import {
	type TopicWithRelationships,
	TopicWithRelationshipsSchema
} from '~/features/topics/api/schemas'
import { apiFetch } from '~/utils/apiFetch'

async function fetchInboxTopics(): Promise<Array<TopicWithRelationships>> {
	const searchParams = new URLSearchParams({ inboxed: 'true' })

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/?${searchParams.toString()}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(v.array(TopicWithRelationshipsSchema), data)
}

export function useInboxTopics() {
	return useQuery({
		queryKey: ['topics', 'inbox'],
		queryFn: fetchInboxTopics
	})
}
