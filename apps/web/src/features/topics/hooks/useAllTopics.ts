import { useQuery } from '@tanstack/react-query'
import { getTopicsList } from '../api'

export function useAllTopics() {
	return useQuery({
		queryKey: ['topics', 'all'],
		queryFn: () => getTopicsList()
	})
}
