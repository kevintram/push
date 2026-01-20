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

	// With tree structure, parent is singular (0 or 1)
	if (topic.parent) {
		queryClient.setQueryData(topicKeys.parents(topic.id), [topic.parent])
	}

	if (topic.children && topic.children.length > 0) {
		queryClient.setQueryData(topicKeys.children(topic.id), topic.children)
	}

	// Combine outgoing and incoming related topics for the related query cache
	const allRelated = [
		...(topic.related_outgoing ?? []),
		...(topic.related_incoming ?? [])
	]
	if (allRelated.length > 0) {
		queryClient.setQueryData(topicKeys.related(topic.id), allRelated)
	}
}
