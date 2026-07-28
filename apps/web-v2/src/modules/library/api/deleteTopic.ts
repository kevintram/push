import {
	type QueryKey,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import * as v from 'valibot'

import { mutationScopes, optimisticMutationKeys } from '~/lib/mutationConfig'
import {
	combineRollbacks,
	type OptimisticContext,
	type Rollback,
} from '~/lib/optimistic'
import {
	excludeDeletedFromOptimisticBatch,
	invalidateAfterOptimisticBatch,
} from '~/lib/optimisticInvalidation'
import { reviewCardQueries, reviewQueries } from '~/modules/reviews/api/queries'
import type { Review, ReviewCard } from '~/modules/reviews/types/review.types'
import { apiFetch } from '~/utils/apiFetch'

import type { TopicWithChildren } from '../types/topic.types'
import { topicQueries } from './queries'

type TopicRemoval = {
	index: number
	parentId?: string
	topic: TopicWithChildren
}

type RemovedItem<T> = {
	index: number
	item: T
}

function findTopicRemoval(
	topics: Array<TopicWithChildren>,
	id: string,
	parentId?: string,
): TopicRemoval | undefined {
	for (const [index, topic] of topics.entries()) {
		if (topic.id === id) return { index, parentId, topic }
		const match = topic.children
			? findTopicRemoval(topic.children, id, topic.id)
			: undefined
		if (match) return match
	}
}

function removeTopic(
	topics: Array<TopicWithChildren>,
	id: string,
): Array<TopicWithChildren> {
	return topics
		.filter(topic => topic.id !== id)
		.map(topic => ({
			...topic,
			children: topic.children
				? removeTopic(topic.children, id)
				: topic.children,
		}))
}

function insertTopic(
	topics: Array<TopicWithChildren>,
	removal: TopicRemoval,
): Array<TopicWithChildren> {
	if (findTopicRemoval(topics, removal.topic.id)) return topics
	if (removal.parentId === undefined) {
		const next = [...topics]
		next.splice(Math.min(removal.index, next.length), 0, removal.topic)
		return next
	}

	return topics.map(topic => {
		if (topic.id === removal.parentId) {
			const children = [...(topic.children ?? [])]
			children.splice(
				Math.min(removal.index, children.length),
				0,
				removal.topic,
			)
			return { ...topic, children }
		}
		return {
			...topic,
			children: topic.children
				? insertTopic(topic.children, removal)
				: topic.children,
		}
	})
}

function collectTopicIds(topic: TopicWithChildren, ids: Set<string>): void {
	ids.add(topic.id)
	for (const child of topic.children ?? []) collectTopicIds(child, ids)
}

function removeItems<T>(
	items: Array<T>,
	matches: (item: T) => boolean,
): { next: Array<T>; removed: Array<RemovedItem<T>> } {
	const removed: Array<RemovedItem<T>> = []
	const next = items.filter((item, index) => {
		if (!matches(item)) return true
		removed.push({ index, item })
		return false
	})
	return { next, removed }
}

function restoreItems<T>(
	current: Array<T>,
	removed: Array<RemovedItem<T>>,
	getId: (item: T) => string,
): Array<T> {
	const next = [...current]
	for (const { index, item } of removed) {
		if (next.some(existing => getId(existing) === getId(item))) continue
		next.splice(Math.min(index, next.length), 0, item)
	}
	return next
}

export async function deleteTopic(id: string): Promise<void> {
	await apiFetch(v.unknown(), `/topics/${id}/`, {
		method: 'DELETE',
	})
}

export function useDeleteTopic() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: [...optimisticMutationKeys.topics, 'delete'],
		scope: mutationScopes.topics,
		mutationFn: deleteTopic,
		meta: { errorMessage: 'Failed to delete topic' },
		onMutate: async (
			id,
		): Promise<
			OptimisticContext & {
				deletedReviewCardIds: Array<string>
				deletedTopicIds: Array<string>
			}
		> => {
			await Promise.all([
				queryClient.cancelQueries({ queryKey: topicQueries.all }),
				queryClient.cancelQueries({ queryKey: reviewCardQueries.all }),
				queryClient.cancelQueries({ queryKey: reviewQueries.all }),
			])

			const deletedTopicIds = new Set<string>([id])
			const topicListEntries = queryClient.getQueriesData<
				Array<TopicWithChildren>
			>({ queryKey: topicQueries.lists() })
			for (const [, topics] of topicListEntries) {
				const removal = topics && findTopicRemoval(topics, id)
				if (removal) collectTopicIds(removal.topic, deletedTopicIds)
			}

			const deletedReviewCardIds = new Set<string>()
			for (const [, data] of queryClient.getQueriesData<
				ReviewCard | Array<ReviewCard>
			>({ queryKey: reviewCardQueries.all })) {
				const cards = Array.isArray(data) ? data : data ? [data] : []
				for (const card of cards) {
					if (deletedTopicIds.has(card.topic_id)) {
						deletedReviewCardIds.add(card.id)
					}
				}
			}
			for (const [, reviews] of queryClient.getQueriesData<Array<Review>>(
				{ queryKey: reviewQueries.lists() },
			)) {
				for (const review of reviews ?? []) {
					if (deletedTopicIds.has(review.review_card.topic_id)) {
						deletedReviewCardIds.add(review.review_card_id)
					}
				}
			}

			const rollbacks: Array<Rollback> = []
			for (const [queryKey, topics] of topicListEntries) {
				const removal = topics && findTopicRemoval(topics, id)
				if (!topics || !removal) continue
				queryClient.setQueryData<Array<TopicWithChildren>>(
					queryKey,
					removeTopic(topics, id),
				)
				rollbacks.push(() => {
					queryClient.setQueryData<Array<TopicWithChildren>>(
						queryKey,
						current =>
							current ? insertTopic(current, removal) : current,
					)
				})
			}

			for (const [queryKey, cards] of queryClient.getQueriesData<
				Array<ReviewCard>
			>({ queryKey: reviewCardQueries.lists() })) {
				if (!cards) continue
				const { next, removed } = removeItems(cards, card =>
					deletedTopicIds.has(card.topic_id),
				)
				if (removed.length === 0) continue
				queryClient.setQueryData(queryKey, next)
				rollbacks.push(() => {
					queryClient.setQueryData<Array<ReviewCard>>(
						queryKey,
						current =>
							current
								? restoreItems(
										current,
										removed,
										card => card.id,
									)
								: current,
					)
				})
			}

			for (const [queryKey, reviews] of queryClient.getQueriesData<
				Array<Review>
			>({ queryKey: reviewQueries.lists() })) {
				if (!reviews) continue
				const { next, removed } = removeItems(
					reviews,
					review =>
						deletedTopicIds.has(review.review_card.topic_id) ||
						deletedReviewCardIds.has(review.review_card_id),
				)
				if (removed.length === 0) continue
				queryClient.setQueryData(queryKey, next)
				rollbacks.push(() => {
					queryClient.setQueryData<Array<Review>>(queryKey, current =>
						current
							? restoreItems(
									current,
									removed,
									review => review.id,
								)
							: current,
					)
				})
			}

			return {
				deletedReviewCardIds: [...deletedReviewCardIds],
				deletedTopicIds: [...deletedTopicIds],
				rollback: combineRollbacks(rollbacks),
			}
		},
		onError: (_error, _id, context) => context?.rollback(),
		onSuccess: (_data, _id, context) => {
			if (!context) return
			const deletedKeys: Array<QueryKey> = []
			for (const topicId of context.deletedTopicIds) {
				deletedKeys.push(
					topicQueries.detail(topicId).queryKey,
					reviewCardQueries.list({ topicId }).queryKey,
				)
			}
			for (const reviewCardId of context.deletedReviewCardIds) {
				deletedKeys.push(
					reviewCardQueries.detail(reviewCardId).queryKey,
					reviewQueries.forCard(reviewCardId),
				)
			}

			for (const queryKey of deletedKeys) {
				queryClient.removeQueries({ queryKey, type: 'inactive' })
			}
			// Mounted queries survive `removeQueries`, so keep the settled
			// invalidation from refetching them into a 404.
			excludeDeletedFromOptimisticBatch(queryClient, deletedKeys)
		},
		onSettled: () =>
			invalidateAfterOptimisticBatch(queryClient, [
				topicQueries.all,
				reviewCardQueries.all,
				reviewQueries.all,
			]),
	})
}
