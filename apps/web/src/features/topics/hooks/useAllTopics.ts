import { useQuery } from '@tanstack/react-query'
import { getTopics } from '../api'

export function useAllTopics() {
	return useQuery({
		queryKey: ['topics', 'all'],
		queryFn: () => getTopics()
	})
}
