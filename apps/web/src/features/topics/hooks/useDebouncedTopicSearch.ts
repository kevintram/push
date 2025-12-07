import { useSearchTopics } from '~/features/topics/api/searchTopics'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import type { Topic } from '~/models/review-topic.types'

interface UseDebouncedTopicSearchOptions {
	query?: string
	enabled?: boolean
	limit?: number
	queryKey?: Array<unknown> | ((debouncedQuery: string) => Array<unknown>)
}

export function useDebouncedTopicSearch({
	query = '',
	enabled = true,
	limit = 10,
	queryKey
}: UseDebouncedTopicSearchOptions = {}) {
	const debouncedQuery = useDebouncedValue(query, 300)

	const trimmedQuery = debouncedQuery.trim()
	const hasQuery = trimmedQuery.length > 0

	const resolvedQueryKey =
		typeof queryKey === 'function'
			? queryKey(trimmedQuery)
			: (queryKey ?? ['topics', 'search', trimmedQuery || 'recent'])

	const { data: results = [], isLoading } = useSearchTopics({
		query: trimmedQuery || undefined,
		limit,
		enabled,
		queryKey: resolvedQueryKey
	})

	return {
		debouncedQuery,
		results: (enabled ? results : []) as Array<Topic>,
		isLoading: enabled ? isLoading : false,
		hasQuery
	}
}
