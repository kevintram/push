import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Topic } from '~/types/topics.types'
import { getTopic } from '../api/getTopic'

/**
 * Hook to fetch a topic with its direct parents and children (depth = 1 only)
 */
export function useTopicWithRelationships(topicId: number | undefined) {
	const { data: topicData, isLoading } = useQuery({
		queryKey: ['topics', topicId],
		queryFn: () => getTopic(topicId!),
		enabled: topicId !== undefined
	})

	const topic: Topic | undefined = useMemo(() => {
		if (!topicData) return

		return {
			...topicData,
			parents: topicData.parents ?? [],
			children: topicData.children ?? []
		}
	}, [topicData])

	return { topic, isLoading }
}
