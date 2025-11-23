import { useQuery } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useState } from 'react'
import { searchTopics } from '~/features/topics/api/searchTopics'
import type { Topic } from '~/models/review-topic.types'

export function useGlobalSearch(externalQuery = '', enabled = true) {
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

	const { data: results = [], isLoading } = useQuery({
		queryKey: ['topics', 'search', trimmedQuery || 'recent'],
		queryFn: () =>
			searchTopics({
				query: trimmedQuery || undefined,
				limit: 10
			}),
		enabled
	})

	return {
		debouncedQuery,
		results: (enabled ? results : []) as Array<Topic>,
		isLoading: enabled ? isLoading : false,
		hasQuery
	}
}
