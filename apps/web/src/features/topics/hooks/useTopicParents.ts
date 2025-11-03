import { useQuery } from '@tanstack/react-query'
import { getTopicParents } from '../api/getTopicParents'

/**
 * Hook to fetch all parents of a topic with their relationships and todos
 */
export function useTopicParents(topicId: number | undefined) {
	return useQuery({
		queryKey: ['topics', topicId, 'parents'],
		queryFn: () => getTopicParents(topicId!),
		enabled: topicId !== undefined
	})
}
