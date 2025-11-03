import { useQuery } from '@tanstack/react-query'
import { getTopicChildren } from '../api/getTopicChildren'

/**
 * Hook to fetch all children of a topic with their relationships and todos
 */
export function useTopicChildren(topicId: number | undefined) {
	return useQuery({
		queryKey: ['topics', topicId, 'children'],
		queryFn: () => getTopicChildren(topicId!),
		enabled: topicId !== undefined
	})
}
