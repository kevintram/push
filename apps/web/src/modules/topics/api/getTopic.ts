import { queryOptions, useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { HttpStatusError } from '~/utils/httpStatusError'
import { TopicSchema } from '../types/topic.schemas'
import type { Topic } from '../types/topic.types'
import { topicKeys } from './queryKeys'

const TOPIC_QUERY_STALE_TIME = 30_000

export async function getTopic(topicId: number): Promise<Topic> {
	const url = `${import.meta.env.VITE_API_URL}/topics/${topicId}/`
	const response = await apiFetch(url)

	if (!response.ok) {
		throw new HttpStatusError(response.status, url, response.statusText)
	}

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

export function topicQueryOptions(topicId: number) {
	return queryOptions({
		queryKey: topicKeys.detail(topicId),
		queryFn: () => getTopic(topicId),
		staleTime: TOPIC_QUERY_STALE_TIME
	})
}

export function useTopic(topicId: number | null) {
	return useQuery({
		...(topicId === null ? topicQueryOptions(-1) : topicQueryOptions(topicId)),
		enabled: topicId !== null
	})
}
