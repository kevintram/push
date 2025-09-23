import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useState } from 'react'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

export function useGlobalSearch(externalQuery = '') {
	const [debouncedQuery, setDebouncedQuery] = useState('')

	const updateDebouncedQuery = useCallback(
		debounce((term: string) => setDebouncedQuery(term), 300),
		[]
	)

	useEffect(() => {
		updateDebouncedQuery(externalQuery)
	}, [externalQuery, updateDebouncedQuery])

	const { data: searchResults, isLoading: isSearchLoading } = useQuery<Array<Tables<'topics'>>>(
		supabase
			.from('topics')
			.select('*')
			.or(`name.ilike.%${debouncedQuery}%,notes.ilike.%${debouncedQuery}%`)
			.order('name', { ascending: true })
			.limit(10),
		{
			enabled: debouncedQuery.trim().length > 0
		}
	)

	const { data: recentResults, isLoading: isRecentLoading } = useQuery<Array<Tables<'topics'>>>(
		supabase
			.from('topics')
			.select('*')
			.order('updated_at', { ascending: false })
			.limit(10),
		{
			enabled: debouncedQuery.trim().length === 0
		}
	)

	const hasQuery = debouncedQuery.trim().length > 0
	const results = hasQuery ? searchResults : recentResults
	const isLoading = hasQuery ? isSearchLoading : isRecentLoading

	return {
		debouncedQuery,
		results: results || [],
		isLoading: isLoading && (hasQuery || debouncedQuery.trim().length === 0),
		hasQuery
	}
}
