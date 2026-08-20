import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import { topicQueries } from '~/modules/library/api/topicQueries'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'

const SEARCH_DEBOUNCE_MS = 250

export function useSearchResults() {
	const [query, setQuery] = useState('')
	const trimmedQuery = query.trim()
	const debouncedQuery = useDebouncedValue(trimmedQuery, SEARCH_DEBOUNCE_MS)
	const enabled = debouncedQuery !== ''

	const topicsQuery = useQuery({
		...topicQueries.search(debouncedQuery),
		enabled,
	})
	const reviewCardsQuery = useQuery({
		...reviewCardQueries.search(debouncedQuery),
		enabled,
	})

	const isWaitingForDebounce = trimmedQuery !== debouncedQuery

	return {
		isError: topicsQuery.isError || reviewCardsQuery.isError,
		isLoading:
			trimmedQuery !== '' &&
			(isWaitingForDebounce ||
				topicsQuery.isPending ||
				reviewCardsQuery.isPending),
		query,
		reviewCards: reviewCardsQuery.data ?? [],
		setQuery,
		topics: topicsQuery.data ?? [],
	}
}
