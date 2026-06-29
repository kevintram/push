import { useCallback, useState } from 'react'

/**
 * Hook that provides common event handlers for review pages.
 */
export function useReviewPageHandlers() {
	const [selectedReviewId, setSelectedReviewId] = useState<number | null>(
		null,
	)

	const handleReviewClick = useCallback((reviewId: number) => {
		setSelectedReviewId(reviewId)
	}, [])

	const closeReviewDialog = useCallback(() => {
		setSelectedReviewId(null)
	}, [])

	return {
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog,
	}
}
