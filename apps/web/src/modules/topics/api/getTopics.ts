import { queryOptions, useQuery } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { TopicSchema } from '../types/topic.schemas'
import { type GetTopicsParams, type Topic } from '../types/topic.types'
import { topicKeys } from './queryKeys'

const TOPICS_QUERY_STALE_TIME = 30_000

export async function getTopics(
	params: GetTopicsParams = {},
): Promise<Array<Topic>> {
	const searchParams = new URLSearchParams()

	if (params.root !== undefined) {
		searchParams.append('root', String(params.root))
	}
	if (params.parent_id !== undefined) {
		searchParams.append('parent_id', String(params.parent_id))
	}
	if (params.subtree_of !== undefined) {
		searchParams.append('subtree_of', String(params.subtree_of))
	}
	if (params.sort !== undefined) {
		searchParams.append('sort', params.sort)
	}
	if (params.order !== undefined) {
		searchParams.append('order', params.order)
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
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

export function topicsQueryOptions(params: GetTopicsParams = {}) {
	return queryOptions({
		queryKey: topicKeys.list(params),
		queryFn: () => getTopics(params),
		staleTime: TOPICS_QUERY_STALE_TIME,
	})
}

export function useTopics(
	params: GetTopicsParams = {},
	options?: { enabled?: boolean },
) {
	return useQuery({
		...topicsQueryOptions(params),
		enabled: options?.enabled ?? true,
	})
}
