import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useCreateTopicWithReview } from '~/features/reviews/api/createReview'
import type { Topic } from '~/features/topics/types/topic.types'

/**
 * Hook that provides common event handlers for review pages.
 *
 * This hook encapsulates the logic for handling user interactions on review pages,
 * including navigating to review pages, navigating to topic pages, and creating new topics.
 *
 * @returns An object containing:
 *   - `handleReviewClick`: Function to navigate to a review page by review ID
 *   - `handleTopicClick`: Function to navigate to a topic page by topic object
 *   - `handleCreateTopic`: Async function to create a new topic and navigate to its page
 *   - `isCreatingTopic`: Boolean indicating if a topic is currently being created
 *
 * @example
 * ```tsx
 * const {
 *   handleReviewClick,
 *   handleTopicClick,
 *   handleCreateTopic,
 *   isCreatingTopic
 * } = useReviewPageHandlers()
 *
 * // Navigate to review page
 * handleReviewClick(123)
 *
 * // Navigate to topic page
 * handleTopicClick(topic)
 *
 * // Create and navigate to a new topic
 * await handleCreateTopic()
 * ```
 */
export function useReviewSessionPageHandlers() {
	const navigate = useNavigate()
	const { createTopicWithReview, isTopicCreatePending: isCreatingTopic } =
		useCreateTopicWithReview()

	const handleReviewClick = useCallback(
		(reviewId: number) => {
			navigate({
				to: '/review-session/$reviewSessionId',
				params: { reviewSessionId: reviewId.toString() }
			})
		},
		[navigate]
	)

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topic.id.toString() }
			})
		},
		[navigate]
	)

	const handleCreateTopic = useCallback(async () => {
		const createdTopic = await createTopicWithReview({})
		navigate({
			to: '/topics/$topicId',
			params: { topicId: createdTopic.id.toString() }
		})
	}, [createTopicWithReview, navigate])

	return {
		handleReviewClick,
		handleTopicClick,
		handleCreateTopic,
		isCreatingTopic
	}
}
