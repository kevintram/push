import { useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useCreateTopic } from '~/features/topics/api/createTopic'

/**
 * Hook that provides common event handlers for review pages.
 *
 * This hook encapsulates the logic for handling user interactions on review pages,
 * including navigating to review session pages, opening review dialogs, and creating new topics.
 *
 * @returns An object containing:
 *   - `handleSessionClick`: Function to navigate to a review session page by session ID
 *   - `handleReviewClick`: Function to open a review in a dialog by review ID
 *   - `selectedReviewId`: The currently selected review ID (for dialog)
 *   - `closeReviewDialog`: Function to close the review dialog
 *   - `handleCreateTopic`: Async function to create a new topic and navigate to its page
 *   - `isCreatingTopic`: Boolean indicating if a topic is currently being created
 */
export function useReviewSessionPageHandlers() {
	const navigate = useNavigate()
	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()
	const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)

	const handleSessionClick = useCallback(
		(sessionId: number) => {
			navigate({
				to: '/review-session/$reviewSessionId',
				params: { reviewSessionId: sessionId.toString() }
			})
		},
		[navigate]
	)

	const handleReviewClick = useCallback((reviewId: number) => {
		setSelectedReviewId(reviewId)
	}, [])

	const closeReviewDialog = useCallback(() => {
		setSelectedReviewId(null)
	}, [])

	const handleCreateTopic = useCallback(async () => {
		const createdTopic = await createTopic({})
		navigate({
			to: '/topics/$topicId',
			params: { topicId: createdTopic.id.toString() }
		})
	}, [createTopic, navigate])

	return {
		handleSessionClick,
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog,
		handleCreateTopic,
		isCreatingTopic
	}
}
