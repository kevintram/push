import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Topic } from '~/models/review-topic.types'
import { getTopics } from '../api/getTopics'

/**
 * Hook to fetch multiple topics with their direct parents and children (depth = 1 only)
 */
export function useTopicsWithRelationships(topicIds: Array<number>) {
	const { data: topics = [], isLoading } = useQuery({
		queryKey: ['topics', 'batch', topicIds],
		queryFn: () => getTopics({ topicIds }),
		enabled: topicIds.length > 0
	})

	// Preserve order from topicIds
	const orderedTopics: Array<Topic> = useMemo(() => {
		const topicMap = new Map(topics.map(t => [t.id, t]))
		return topicIds.map(id => topicMap.get(id)).filter(Boolean) as Array<Topic>
	}, [topicIds, topics])

	return { topics: orderedTopics, isLoading }
}
