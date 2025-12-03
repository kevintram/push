import { useQuery } from '@tanstack/react-query'
import { getTopics } from '../api'

export function useRecentTopics() {
	return useQuery({
		queryKey: ['topics', 'recent'],
		queryFn: () => getTopics({ order: 'desc', limit: 50 })
	})
}
