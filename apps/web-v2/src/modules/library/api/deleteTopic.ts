import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { reviewCardQueries, reviewQueries } from '~/modules/reviews/api/queries'
import type { Review, ReviewCard } from '~/modules/reviews/types/review.types'
import { apiFetch } from '~/utils/apiFetch'

import type { TopicWithChildren } from '../types/topic.types'
import { topicQueries } from './queries'

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

function findTopic(
	topics: Array<TopicWithChildren>,
	id: string,
): TopicWithChildren | undefined {
	for (const topic of topics) {
		if (topic.id === id) return topic
		const match = topic.children ? findTopic(topic.children, id) : undefined
		if (match) return match
	}
}

function collectTopicIds(topic: TopicWithChildren, ids: Set<string>): void {
	ids.add(topic.id)
	for (const child of topic.children ?? []) collectTopicIds(child, ids)
}

export async function deleteTopic(id: string): Promise<void> {
	await apiFetch(v.unknown(), `/topics/${id}/`, {
		method: 'DELETE',
	})
}

export function useDeleteTopic() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: deleteTopic,
		onSuccess: (_, id) => {
			const deletedTopicIds = new Set<string>([id])
			for (const [, topics] of queryClient.getQueriesData<
				Array<TopicWithChildren>
			>({ queryKey: topicQueries.lists() })) {
				const deletedTopic = topics && findTopic(topics, id)
				if (deletedTopic) collectTopicIds(deletedTopic, deletedTopicIds)
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
				{
					queryKey: reviewQueries.lists(),
				},
			)) {
				for (const review of reviews ?? []) {
					if (deletedTopicIds.has(review.review_card.topic_id)) {
						deletedReviewCardIds.add(review.review_card_id)
					}
				}
			}

			queryClient.setQueriesData<Array<TopicWithChildren>>(
				{ queryKey: topicQueries.lists() },
				topics => (topics ? removeTopic(topics, id) : topics),
			)
			queryClient.setQueriesData<Array<ReviewCard>>(
				{ queryKey: reviewCardQueries.lists() },
				cards =>
					cards?.filter(card => !deletedTopicIds.has(card.topic_id)),
			)

			for (const topicId of deletedTopicIds) {
				queryClient.removeQueries({
					queryKey: topicQueries.detail(topicId).queryKey,
				})
				queryClient.removeQueries({
					queryKey: reviewCardQueries.list({ topicId }).queryKey,
				})
			}
			for (const reviewCardId of deletedReviewCardIds) {
				queryClient.removeQueries({
					queryKey: reviewCardQueries.detail(reviewCardId).queryKey,
				})
				queryClient.removeQueries({
					queryKey: reviewQueries.forCard(reviewCardId),
				})
			}
		},
	})
}
