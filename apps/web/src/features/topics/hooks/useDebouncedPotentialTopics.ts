import { useState } from 'react'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import { useSearchTopics } from '../api/searchTopics'

interface UseDebouncedPotentialTopicsProps {
	topicId: number | undefined
	relationshipType: 'child' | 'parent' | 'related'
	debounceMs?: number
	enabled?: boolean
}

export function useDebouncedPotentialTopics({
	topicId,
	relationshipType,
	debounceMs = 300,
	enabled = true
}: UseDebouncedPotentialTopicsProps) {
	const [query, setQuery] = useState('')
	const debouncedQuery = useDebouncedValue(query, debounceMs)

	const {
		data: results = [],
		isLoading,
		error
	} = useSearchTopics({
		query: debouncedQuery || undefined,
		addableAsChildTo: relationshipType === 'child' ? topicId : undefined,
		addableAsParentTo: relationshipType === 'parent' ? topicId : undefined,
		addableAsRelatedTo: relationshipType === 'related' ? topicId : undefined,
		enabled: enabled && !!topicId
	})

	return {
		query,
		setQuery,
		debouncedQuery,
		results,
		isLoading,
		error
	}
}
