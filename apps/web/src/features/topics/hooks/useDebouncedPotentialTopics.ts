import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Topic } from '~/models/todo-topic.types'
import { useGetPotentialChildren } from './useGetPotentialChildren'
import { useGetPotentialParents } from './useGetPotentialParents'

interface UseDebouncedPotentialTopicsProps {
	topicId: number | undefined
	relationshipType: 'child' | 'parent'
	debounceMs?: number
}

export function useDebouncedPotentialTopics({
	topicId,
	relationshipType,
	debounceMs = 300
}: UseDebouncedPotentialTopicsProps) {
	const [query, setQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')

	const updateDebouncedQuery = useCallback(
		debounce((term: string) => setDebouncedQuery(term), debounceMs),
		[]
	)

	useEffect(() => {
		updateDebouncedQuery(query)
	}, [query, updateDebouncedQuery])

	const {
		data: potentialChildren = [],
		isLoading: isLoadingChildren,
		error: childrenError
	} = useGetPotentialChildren(topicId, debouncedQuery || undefined, {
		enabled: relationshipType === 'child' && !!topicId
	})

	const {
		data: potentialParents = [],
		isLoading: isLoadingParents,
		error: parentsError
	} = useGetPotentialParents(topicId, debouncedQuery || undefined, {
		enabled: relationshipType === 'parent' && !!topicId
	})

	const results = useMemo((): Array<Topic> => {
		if (relationshipType === 'child') {
			return potentialChildren
		}
		return potentialParents
	}, [relationshipType, potentialChildren, potentialParents])

	const isLoading =
		relationshipType === 'child' ? isLoadingChildren : isLoadingParents
	const error = relationshipType === 'child' ? childrenError : parentsError

	return {
		query,
		setQuery,
		debouncedQuery,
		results,
		isLoading,
		error
	}
}
