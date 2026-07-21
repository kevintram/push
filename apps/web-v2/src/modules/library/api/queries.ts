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
	detail: (topicId: string) => {
		const normalizedTopicId = String(topicId)
		return queryOptions({
			queryKey: [...topicQueries.all, 'detail', normalizedTopicId],
			queryFn: () => fetchTopic(normalizedTopicId),
		})
	},
}
