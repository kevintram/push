import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import type { GetTopicsParams } from '../types/api.types'
import { type Topic, TopicSchema } from '../types/topic.types'
import { topicKeys } from './queryKeys'

export async function getTopics(
	params: GetTopicsParams = {}
): Promise<Array<Topic>> {
	const searchParams = new URLSearchParams()

	if (params.root !== undefined) {
		searchParams.append('root', String(params.root))
	}

	if (params.inboxed !== undefined) {
		searchParams.append('inboxed', String(params.inboxed))
	}

	if (params.archived !== undefined) {
		searchParams.append('archived', String(params.archived))
	}

	if (params.order !== undefined) {
		searchParams.append('order', params.order)
	}

	if (params.limit !== undefined) {
		searchParams.append('limit', String(params.limit))
	}

	if (params.dueBefore !== undefined) {
		searchParams.append('due_before', params.dueBefore)
	}

	if (params.dueAfter !== undefined) {
		searchParams.append('due_after', params.dueAfter)
	}

	if (params.srsEnabled !== undefined) {
		searchParams.append('srs_enabled', String(params.srsEnabled))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(TopicSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useTopics(
	params: GetTopicsParams = {},
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: topicKeys.list(params),
		queryFn: () => getTopics(params),
		enabled: options?.enabled ?? true
	})
}
