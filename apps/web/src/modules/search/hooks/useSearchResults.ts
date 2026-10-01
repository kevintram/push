import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import { collectionQueries } from '~/modules/library/api/collectionQueries'
import { cardQueries } from '~/modules/reviews/api/cardQueries'

const SEARCH_DEBOUNCE_MS = 250

export function useSearchResults() {
	const [query, setQuery] = useState('')
	const trimmedQuery = query.trim()
	const debouncedQuery = useDebouncedValue(trimmedQuery, SEARCH_DEBOUNCE_MS)
	const enabled = debouncedQuery !== ''

	const collectionsQuery = useQuery({
		...collectionQueries.search(debouncedQuery),
		enabled,
	})
	const cardsQuery = useQuery({
		...cardQueries.search(debouncedQuery),
		enabled,
	})

	const isWaitingForDebounce = trimmedQuery !== debouncedQuery

	return {
		isError: collectionsQuery.isError || cardsQuery.isError,
		isLoading:
			trimmedQuery !== '' &&
			(isWaitingForDebounce ||
				collectionsQuery.isPending ||
				cardsQuery.isPending),
		query,
		cards: cardsQuery.data ?? [],
		setQuery,
		collections: collectionsQuery.data ?? [],
	}
}
