import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import type { Topic } from '~/models/review-topic.types'
import { searchTopics } from '../api/searchTopics'

export function useGetPotentialChildren(
	topicId: number | undefined,
	searchQuery?: string,
	options?: Omit<UseQueryOptions<Array<Topic>, Error>, 'queryKey' | 'queryFn'>
) {
	return useQuery({
		queryKey: ['potential-children', topicId, searchQuery],
		queryFn: async (): Promise<Array<Topic>> => {
			if (!topicId) return []

			return searchTopics({
				query: searchQuery,
				addableAsChildTo: topicId
			})
		},
		...options
	})
}
