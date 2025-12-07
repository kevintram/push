import { useQuery } from '@tanstack/react-query'
import { getTopics } from '../api/getTopics'

export function useInboxTopics() {
	return useQuery({
		queryKey: ['topics', 'inbox'],
		queryFn: () => getTopics({ inboxed: true, archived: false })
	})
}
