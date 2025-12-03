import { useQuery } from '@tanstack/react-query'
import { getTopics } from '../api'

type UseRootTopicsParams = {
	inboxed?: boolean
	archived?: boolean
}

export function useRootTopics(params: UseRootTopicsParams = {}) {
	return useQuery({
		queryKey: ['topics', 'root', params],
		queryFn: () => getTopics({ root: true, ...params })
	})
}
