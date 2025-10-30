import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { type Topic, TopicSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type UseRootTopicsParams = {
	inboxed?: boolean
	archived?: boolean
}

async function fetchRootTopics(
	params: UseRootTopicsParams = {}
): Promise<Array<Topic>> {
	const searchParams = new URLSearchParams({ root: 'true' })

	if (params.inboxed !== undefined) {
		searchParams.append('inboxed', String(params.inboxed))
	}

	if (params.archived !== undefined) {
		searchParams.append('archived', String(params.archived))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/?${searchParams.toString()}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(v.array(TopicSchema), data)
}

export function useRootTopics(params: UseRootTopicsParams = {}) {
	return useQuery({
		queryKey: ['topics', 'root', params],
		queryFn: () => fetchRootTopics(params)
	})
}
