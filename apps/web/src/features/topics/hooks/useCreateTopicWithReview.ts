import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import { createReview } from '~/features/reviews/api'
import { createTopicReview } from '~/features/topic_reviews/api/createTopicReview'
import type { Topic } from '~/models/review-topic.types'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { useCreateTopic } from '../api/useCreateTopic'

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
	const { mutateAsync: createTopicAsync, isPending } = useCreateTopic()
	const queryClient = useQueryClient()

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: createReview,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const createTopicWithReview = useCallback(
		async (input: CreateTopicWithReviewInput = {}): Promise<Topic> => {
			// Create the topic
			const newTopic = await createTopicAsync(input)

			// Create a completed "Created" review for today
			const review = await createReviewMutation({
				description: 'Created',
				scheduledAt: null,
				completedAt: dayjs().format('YYYY-MM-DD')
			})

			// Link the review to the topic with a 'good' rating
			await createTopicReview(review.id, newTopic.id, 'good')

			// Invalidate topic-reviews cache to reflect the new association
			queryClient.invalidateQueries({ queryKey: ['topic-reviews'] })

			return newTopic
		},
		[createTopicAsync, createReviewMutation, queryClient]
	)

	return { createTopicWithReview, isPending }
}
