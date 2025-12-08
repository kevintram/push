import { useSearchTopics } from '~/features/topics/api/searchTopics'
import type { Topic } from '~/models/review-topic.types'
import { useDebouncedValue } from './useDebouncedValue'

export function useGlobalSearch(externalQuery = '', enabled = true) {
	const debouncedQuery = useDebouncedValue(externalQuery, 300)

	const trimmedQuery = debouncedQuery.trim()
	const hasQuery = trimmedQuery.length > 0

	const { data: results = [], isLoading } = useSearchTopics({
		query: trimmedQuery || undefined,
		limit: 10,
		enabled
	})

	return {
		debouncedQuery,
		results: (enabled ? results : []) as Array<Topic>,
		isLoading: enabled ? isLoading : false,
		hasQuery
	}
}
