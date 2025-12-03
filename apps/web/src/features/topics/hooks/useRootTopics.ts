import { useQuery } from '@tanstack/react-query'
import { getTopicsList } from '../api'

type UseRootTopicsParams = {
	inboxed?: boolean
	archived?: boolean
}

export function useRootTopics(params: UseRootTopicsParams = {}) {
	return useQuery({
		queryKey: ['topics', 'root', params],
		queryFn: () => getTopicsList({ root: true, ...params })
	})
}
