import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import { createReview } from '~/features/reviews/api'
import { createTopicReview } from '~/features/topic_reviews/api/createTopicReview'
import type { Topic } from '~/models/review-topic.types'
import { createTopic } from '../api'

type CreateTopicWithReviewInput = {
	name?: string
	notes?: string
	stability?: number | null
	difficulty?: number | null
	state?: 'LEARNING' | 'REVIEW' | 'RELEARNING'
	archived?: boolean
	inboxed?: boolean
}

/**
 * Hook that creates a topic along with an associated "Created" review.
 * This encapsulates the common pattern of creating a topic and immediately
 * logging it as a completed review for tracking purposes.
 */
export function useCreateTopicWithReview() {
	const queryClient = useQueryClient()

	const { mutateAsync: createTopicMutation, isPending: isTopicCreatePending } =
		useMutation({
			mutationFn: createTopic
		})
	const {
		mutateAsync: createReviewMutation,
		isPending: isReviewCreatePending
	} = useMutation({
		mutationFn: createReview,
		retry: 2
	})
	const {
		mutateAsync: createTopicReviewMutation,
		isPending: isTopicReviewCreatePending
	} = useMutation({
		mutationFn: ({
			reviewId,
			topicId
		}: {
			reviewId: number
			topicId: number
		}) => createTopicReview(reviewId, topicId, 'good'),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
			queryClient.invalidateQueries({ queryKey: ['topics'] })
		},
		retry: 2
	})

	const createTopicWithReview = useCallback(
		async (input: CreateTopicWithReviewInput = {}): Promise<Topic> => {
			// Start both requests immediately (don't await yet)
			const topicPromise = createTopicMutation(input)
			const reviewPromise = createReviewMutation({
				description: 'Created',
				scheduledAt: null,
				completedAt: dayjs().format('YYYY-MM-DD')
			})

			// Await topic to return it immediately
			const newTopic = await topicPromise

			// Start the linking operation that waits for both (fire-and-forget)
			Promise.all([topicPromise, reviewPromise])
				.then(([topic, review]) => {
					return createTopicReviewMutation({
						reviewId: review.id,
						topicId: topic.id
					})
				})
				.catch(error => {
					console.error('Failed to link topic and review:', error)
					throw error
				})

			return newTopic
		},
		[createTopicMutation, createReviewMutation, createTopicReviewMutation]
	)

	return {
		createTopicWithReview,
		isTopicCreatePending,
		isReviewCreatePending,
		isTopicReviewCreatePending,
		isPending:
			isTopicCreatePending ||
			isReviewCreatePending ||
			isTopicReviewCreatePending
	}
}
