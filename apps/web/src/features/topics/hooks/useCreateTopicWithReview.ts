import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import { createTopicReview } from '~/features/topic_reviews/api/createTopicReview'
import type { Topic } from '~/models/review-topic.types'

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
 *
 * Uses the POST /topic-reviews endpoint with inline topic and review creation
 * to create both entities and link them in a single API call.
 */
export function useCreateTopicWithReview() {
	const queryClient = useQueryClient()

	const { mutateAsync: createTopicReviewMutation, isPending } = useMutation({
		mutationFn: createTopicReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
			queryClient.invalidateQueries({ queryKey: ['topics'] })
		},
		retry: 2
	})

	const createTopicWithReview = useCallback(
		async (input: CreateTopicWithReviewInput = {}): Promise<Topic> => {
			// Create both topic and review in a single API call
			const topicReview = await createTopicReviewMutation({
				topic: {
					name: input.name ?? '',
					notes: input.notes ?? '',
					archived: input.archived ?? false,
					inboxed: input.inboxed ?? true,
					stability: input.stability,
					difficulty: input.difficulty,
					state: input.state,
					srs_enabled: true
				},
				review: {
					description: 'Created',
					notes: '',
					scheduled_at: null,
					completed_at: dayjs().format('YYYY-MM-DD')
				},
				rating: 'good'
			})

			// Return the created topic from the response
			return topicReview.topic
		},
		[createTopicReviewMutation]
	)

	return {
		createTopicWithReview,
		isTopicCreatePending: isPending,
		isReviewCreatePending: false, // No longer separate
		isTopicReviewCreatePending: false, // No longer separate
		isPending
	}
}
