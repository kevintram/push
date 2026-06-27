import { useMemo } from 'react'

import { useTopics } from '../api/getTopics'
import { buildTopicTree } from '../utils/topicTree'

export function useTopicTree(options?: { enabled?: boolean }) {
	const topicsQuery = useTopics(
		{
			sort: 'title',
			order: 'asc',
		},
		options,
	)

	const topicTree = useMemo(
		() => buildTopicTree(topicsQuery.data ?? []),
		[topicsQuery.data],
	)

	return {
		...topicsQuery,
		...topicTree,
	}
}
