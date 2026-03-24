import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	areNumberArraysEqual,
	getStoredExpandedTopicIds,
	TOPIC_NAVIGATOR_EXPANDED_IDS_STORAGE_KEY
} from './TopicNavigator.shared'
import { mergeExpandedTopicIds } from './topicNavigatorUtils'

type UseTopicNavigatorExpansionStateOptions = {
	activeBranchIds: Array<number>
	error: unknown
	isLoading: boolean
	validTopicIds: Set<number>
}

export function useTopicNavigatorExpansionState({
	activeBranchIds,
	error,
	isLoading,
	validTopicIds
}: UseTopicNavigatorExpansionStateOptions) {
	const [expandedIds, setExpandedIds] = useState(getStoredExpandedTopicIds)
	const expandedIdSet = useMemo(() => new Set(expandedIds), [expandedIds])

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (typeof window.localStorage?.setItem !== 'function') return

		window.localStorage.setItem(
			TOPIC_NAVIGATOR_EXPANDED_IDS_STORAGE_KEY,
			JSON.stringify(expandedIds)
		)
	}, [expandedIds])

	useEffect(() => {
		if (isLoading || error) return

		setExpandedIds(previousExpandedIds => {
			const nextExpandedIds = mergeExpandedTopicIds({
				expandedIds: previousExpandedIds,
				idsToExpand: activeBranchIds,
				validTopicIds
			})

			return areNumberArraysEqual(previousExpandedIds, nextExpandedIds)
				? previousExpandedIds
				: nextExpandedIds
		})
	}, [activeBranchIds, error, isLoading, validTopicIds])

	const ensureExpanded = useCallback((topicId: number) => {
		setExpandedIds(previousExpandedIds =>
			previousExpandedIds.includes(topicId)
				? previousExpandedIds
				: [...previousExpandedIds, topicId]
		)
	}, [])

	const toggleExpanded = useCallback((topicId: number) => {
		setExpandedIds(previousExpandedIds =>
			previousExpandedIds.includes(topicId)
				? previousExpandedIds.filter(id => id !== topicId)
				: [...previousExpandedIds, topicId]
		)
	}, [])

	return {
		ensureExpanded,
		expandedIdSet,
		setExpandedIds,
		toggleExpanded
	}
}
