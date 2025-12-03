import { useQuery } from '@tanstack/react-query'
import { getTopics } from '../../topics/api'

export function useInboxTopics() {
	return useQuery({
		queryKey: ['topics', 'inbox'],
		queryFn: () => getTopics({ inboxed: true, archived: false })
	})
}
