import { useCallback, useMemo, useState } from 'react'
import { ReviewSessionDialog } from '~/features/reviews/components/ReviewSessionDialog'
import { TopicDialog } from '~/features/topics/components/TopicDialog'
import { ReviewSessionTopicDialogContext } from '../stores/ReviewSessionTopicDialogContext'

export function ReviewSessionTopicDialogProvider({
	children
}: {
	children: React.ReactNode
}) {
	const [topicDialog, setTopicDialog] = useState<{
		isOpen: boolean
		topicId: number | undefined
	}>({ isOpen: false, topicId: undefined })

	const [reviewSessionDialog, setReviewSessionDialog] = useState<{
		isOpen: boolean
		reviewId: number | undefined
	}>({ isOpen: false, reviewId: undefined })

	const openTopicDialog = useCallback(
		(topicId: number) => {
			// If review dialog is open, close it but keep the ID for potential reopen
			if (reviewSessionDialog.isOpen) {
				setReviewSessionDialog(prev => ({ ...prev, isOpen: false }))
			}
			// Open topic dialog
			setTopicDialog({ isOpen: true, topicId })
		},
		[reviewSessionDialog.isOpen]
	)

	const openReviewSessionDialog = useCallback(
		(reviewId: number) => {
			// If topic dialog is open, close it but keep the ID for potential reopen
			if (topicDialog.isOpen) {
				setTopicDialog(prev => ({ ...prev, isOpen: false }))
			}
			// Open review dialog
			setReviewSessionDialog({ isOpen: true, reviewId })
		},
		[topicDialog.isOpen]
	)

	const closeTopicDialog = useCallback(() => {
		const shouldReopenReview = reviewSessionDialog.reviewId !== undefined

		// Close topic dialog and clear its ID
		setTopicDialog({ isOpen: false, topicId: undefined })

		// If review was previously open, reopen it
		if (shouldReopenReview) {
			setReviewSessionDialog(prev => ({ ...prev, isOpen: true }))
		}
	}, [reviewSessionDialog.reviewId])

	const closeReviewSessionDialog = useCallback(() => {
		const shouldReopenTopic = topicDialog.topicId !== undefined

		// Close review dialog and clear its ID
		setReviewSessionDialog({ isOpen: false, reviewId: undefined })

		// If topic was previously open, reopen it
		if (shouldReopenTopic) {
			setTopicDialog(prev => ({ ...prev, isOpen: true }))
		}
	}, [topicDialog.topicId])

	const maximizeTopicDialog = useCallback(() => {
		// Clear everything so nothing reopens
		setTopicDialog({ isOpen: false, topicId: undefined })
		setReviewSessionDialog({ isOpen: false, reviewId: undefined })
	}, [])

	const maximizeReviewSessionDialog = useCallback(() => {
		// Clear everything so nothing reopens
		setTopicDialog({ isOpen: false, topicId: undefined })
		setReviewSessionDialog({ isOpen: false, reviewId: undefined })
	}, [])

	const contextValue = useMemo(
		() => ({
			topicDialogState: topicDialog,
			reviewSessionDialogState: reviewSessionDialog,
			openTopicDialog,
			closeTopicDialog,
			maximizeTopicDialog,
			openReviewSessionDialog,
			closeReviewSessionDialog,
			maximizeReviewSessionDialog
		}),
		[
			topicDialog,
			reviewSessionDialog,
			openTopicDialog,
			closeTopicDialog,
			maximizeTopicDialog,
			openReviewSessionDialog,
			closeReviewSessionDialog,
			maximizeReviewSessionDialog
		]
	)

	return (
		<ReviewSessionTopicDialogContext value={contextValue}>
			{children}
			<TopicDialog />
			<ReviewSessionDialog />
		</ReviewSessionTopicDialogContext>
	)
}
