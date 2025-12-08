import { useCallback } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicWithReview } from '~/features/reviews/api/createTopicReview'
import type { Topic } from '~/features/topics/types/topic.types'

/**
 * Hook that provides common event handlers for review pages.
 *
 * This hook encapsulates the logic for handling user interactions on review pages,
 * including opening review dialogs, opening topic dialogs, and creating new topics.
 *
 * @returns An object containing:
 *   - `handleReviewClick`: Function to open a review dialog by review ID
 *   - `handleTopicClick`: Function to open a topic dialog by topic object
 *   - `handleCreateTopic`: Async function to create a new topic and open its dialog
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
 * // Open a review dialog
 * handleReviewClick(123)
 *
 * // Open a topic dialog
 * handleTopicClick(topic)
 *
 * // Create and open a new topic
 * await handleCreateTopic()
 * ```
 */
export function useReviewPageHandlers() {
	const { openReviewDialog, openTopicDialog } = useReviewTopicDialog()
	const { createTopicWithReview, isTopicCreatePending: isCreatingTopic } =
		useCreateTopicWithReview()

	const handleReviewClick = useCallback(
		(reviewId: number) => {
			openReviewDialog(reviewId)
		},
		[openReviewDialog]
	)

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	const handleCreateTopic = useCallback(async () => {
		const createdTopic = await createTopicWithReview({})
		openTopicDialog(createdTopic.id)
	}, [createTopicWithReview, openTopicDialog])

	return {
		handleReviewClick,
		handleTopicClick,
		handleCreateTopic,
		isCreatingTopic
	}
}
