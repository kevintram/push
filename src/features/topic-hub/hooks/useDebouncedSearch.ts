import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface UseDebouncedSearchOptions<T extends { id: number; name: string }> {
	topics: Array<T>
	debounceMs?: number
}

export function useDebouncedSearch<T extends { id: number; name: string }>({
	topics,
	debounceMs = 300
}: UseDebouncedSearchOptions<T>) {
	const [query, setQuery] = useState('') // query user typed
	const [debouncedQuery, setDebouncedQuery] = useState('') // actual query used to filter topics

	const updateDebouncedQuery = useCallback(
		debounce((term: string) => setDebouncedQuery(term), debounceMs),
		[debounceMs]
	)

	useEffect(() => {
		updateDebouncedQuery(query)
	}, [query, updateDebouncedQuery])

	const results = useMemo(() => {
		if (!debouncedQuery.trim()) return topics
		return topics.filter(topic =>
			topic.name.toLowerCase().includes(debouncedQuery.toLowerCase())
		)
	}, [topics, debouncedQuery])

	return {
		query,
		setQuery,
		results,
		isSearching: query !== debouncedQuery
	}
}
