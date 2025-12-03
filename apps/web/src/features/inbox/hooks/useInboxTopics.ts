import { useQuery } from '@tanstack/react-query'
import { getTopicsList } from '../../topics/api'

export function useInboxTopics() {
	return useQuery({
		queryKey: ['topics', 'inbox'],
		queryFn: () => getTopicsList({ inboxed: true, archived: false })
	})
}
