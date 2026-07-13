import { queryOptions } from '@tanstack/react-query'

import { fetchTopic, fetchTopics } from './getTopics'

export const topicQueries = {
	all: ['topics'] as const,
	lists: () => [...topicQueries.all, 'lists'],
	list: () =>
		queryOptions({
			queryKey: topicQueries.lists(),
			queryFn: () => fetchTopics(),
		}),
	detail: (topicId: string) =>
		queryOptions({
			queryKey: [...topicQueries.all, 'detail', topicId],
			queryFn: () => fetchTopic(topicId),
		}),
}
