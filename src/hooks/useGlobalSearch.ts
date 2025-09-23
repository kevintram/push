import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useState } from 'react'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

export function useGlobalSearch() {
	const [query, setQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')

	const updateDebouncedQuery = useCallback(
		debounce((term: string) => setDebouncedQuery(term), 300),
		[]
	)

	useEffect(() => {
		updateDebouncedQuery(query)
	}, [query, updateDebouncedQuery])

	const { data: results, isLoading } = useQuery<Array<Tables<'topics'>>>(
		supabase
			.from('topics')
			.select('*')
			.ilike('name', `%${debouncedQuery}%`)
			.order('name', { ascending: true })
			.limit(10),
		{
			enabled: debouncedQuery.trim().length > 0
		}
	)

	return {
		query,
		setQuery,
		results: results || [],
		isLoading: isLoading && debouncedQuery.trim().length > 0,
		hasQuery: debouncedQuery.trim().length > 0
	}
}
