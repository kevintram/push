import { useQuery } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useState } from 'react'
import { searchTopics } from '~/features/topics/api/searchTopics'
import type { Topic } from '~/types/topics.types'

export function useGlobalSearch(externalQuery = '') {
	const [debouncedQuery, setDebouncedQuery] = useState('')

	const updateDebouncedQuery = useCallback(
		debounce((term: string) => setDebouncedQuery(term), 300),
		[]
	)

	useEffect(() => {
		updateDebouncedQuery(externalQuery)
	}, [externalQuery, updateDebouncedQuery])

	const trimmedQuery = debouncedQuery.trim()
	const hasQuery = trimmedQuery.length > 0

	const {
		data: searchResults = [],
		isLoading: isSearchLoading
	} = useQuery({
		queryKey: ['topics', 'search', trimmedQuery],
		queryFn: () =>
			searchTopics({
				query: trimmedQuery,
				limit: 10
			}),
		enabled: hasQuery
	})

	const {
		data: recentResults = [],
		isLoading: isRecentLoading
	} = useQuery({
		queryKey: ['topics', 'search', 'recent'],
		queryFn: () =>
			searchTopics({
				limit: 10
			}),
		enabled: !hasQuery
	})

	const results: Array<Topic> = hasQuery ? searchResults : recentResults
	const isLoading = hasQuery ? isSearchLoading : isRecentLoading

	return {
		debouncedQuery,
		results,
		isLoading: isLoading && (hasQuery || trimmedQuery.length === 0),
		hasQuery
	}
}
