import { queryOptions } from '@tanstack/react-query'

import { fetchTopic, fetchTopics } from './getTopics'

export const topicQueries = {
	all: ['topics'] as const,
	list: () =>
		queryOptions({
			queryKey: [...topicQueries.all, 'list'],
			queryFn: () => fetchTopics(),
		}),
	detail: (topicId: number | string) =>
		queryOptions({
			queryKey: [...topicQueries.all, 'detail', topicId],
			queryFn: () => fetchTopic(topicId),
		}),
}
