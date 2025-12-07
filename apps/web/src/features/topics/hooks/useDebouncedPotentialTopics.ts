import { useMemo, useState } from 'react'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import type { Topic } from '~/models/review-topic.types'
import {
	useGetPotentialChildren,
	useGetPotentialParents
} from '../api/searchTopics'

interface UseDebouncedPotentialTopicsProps {
	topicId: number | undefined
	relationshipType: 'child' | 'parent'
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
		data: potentialChildren = [],
		isLoading: isLoadingChildren,
		error: childrenError
	} = useGetPotentialChildren(topicId, debouncedQuery || undefined, {
		enabled: enabled && relationshipType === 'child' && !!topicId
	})

	const {
		data: potentialParents = [],
		isLoading: isLoadingParents,
		error: parentsError
	} = useGetPotentialParents(topicId, debouncedQuery || undefined, {
		enabled: enabled && relationshipType === 'parent' && !!topicId
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
