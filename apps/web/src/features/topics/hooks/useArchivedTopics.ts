import { useQuery } from '@tanstack/react-query'
import { getTopics } from '../api'

export function useArchivedTopics() {
	return useQuery({
		queryKey: ['topics', 'archived'],
		queryFn: () => getTopics({ archived: true, order: 'desc' })
	})
}
