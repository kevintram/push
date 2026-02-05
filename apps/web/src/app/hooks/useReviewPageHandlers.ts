import { useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useCreateTopic } from '~/features/topics/api/createTopic'

/**
 * Hook that provides common event handlers for review pages.
 */
export function useReviewPageHandlers() {
	const navigate = useNavigate()
	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()
	const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)

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
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog,
		handleCreateTopic,
		isCreatingTopic
	}
}
