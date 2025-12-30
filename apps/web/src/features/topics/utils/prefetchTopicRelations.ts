import type { QueryClient } from '@tanstack/react-query'
import { topicKeys } from '~/features/topics/api/queryKeys'
import type { Topic } from '~/features/topics/types/topic.types'

/**
 * Prefetches topic relation data by storing it in the query cache.
 * This enables instant navigation when hovering over topic cards.
 *
 * @param queryClient - TanStack Query client instance
 * @param topic - Topic with optional relation data to cache
 */
export function prefetchTopicRelations(
	queryClient: QueryClient,
	topic: Topic
): void {
	queryClient.setQueryData(topicKeys.detail(topic.id), topic)

	if (topic.parents && topic.parents.length > 0) {
		queryClient.setQueryData(topicKeys.parents(topic.id), topic.parents)
	}

	if (topic.children && topic.children.length > 0) {
		queryClient.setQueryData(topicKeys.children(topic.id), topic.children)
	}

	if (topic.related && topic.related.length > 0) {
		queryClient.setQueryData(topicKeys.related(topic.id), topic.related)
	}
}
