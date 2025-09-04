import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Topic } from '~/types/topics.types'

interface UseDebouncedSearchOptions {
	topics: Array<Topic>
	debounceMs?: number
}

export function useDebouncedSearch({
	topics,
	debounceMs = 300
}: UseDebouncedSearchOptions) {
	const [searchTerm, setSearchTerm] = useState('')
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

	const debouncedSetSearch = useCallback(
		debounce((term: string) => {
			setDebouncedSearchTerm(term)
		}, debounceMs),
		[]
	)

	useEffect(() => {
		debouncedSetSearch(searchTerm)
	}, [searchTerm, debouncedSetSearch])

	const filteredTopics = useMemo(() => {
		return topics.filter(topic =>
			topic.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
		)
	}, [topics, debouncedSearchTerm])

	return {
		searchTerm,
		setSearchTerm,
		filteredTopics,
		debouncedSearchTerm
	}
}
