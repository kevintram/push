import { useCallback, useMemo, useState } from 'react'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { TopicDialog } from '~/features/topics/components/TopicDialog'
import { ReviewTopicDialogContext } from '../stores/ReviewTopicDialogContext'

export function ReviewTopicDialogProvider({
	children
}: {
	children: React.ReactNode
}) {
	const [topicDialog, setTopicDialog] = useState<{
		isOpen: boolean
		topicId: number | undefined
	}>({ isOpen: false, topicId: undefined })

	const [reviewDialog, setReviewDialog] = useState<{
		isOpen: boolean
		reviewId: number | undefined
	}>({ isOpen: false, reviewId: undefined })

	const openTopicDialog = useCallback(
		(topicId: number) => {
			// If review dialog is open, close it but keep the ID for potential reopen
			if (reviewDialog.isOpen) {
				setReviewDialog(prev => ({ ...prev, isOpen: false }))
			}
			// Open topic dialog
			setTopicDialog({ isOpen: true, topicId })
		},
		[reviewDialog.isOpen]
	)

	const openReviewDialog = useCallback(
		(reviewId: number) => {
			// If topic dialog is open, close it but keep the ID for potential reopen
			if (topicDialog.isOpen) {
				setTopicDialog(prev => ({ ...prev, isOpen: false }))
			}
			// Open review dialog
			setReviewDialog({ isOpen: true, reviewId })
		},
		[topicDialog.isOpen]
	)

	const closeTopicDialog = useCallback(() => {
		const shouldReopenReview = reviewDialog.reviewId !== undefined

		// Close topic dialog and clear its ID
		setTopicDialog({ isOpen: false, topicId: undefined })

		// If review was previously open, reopen it
		if (shouldReopenReview) {
			setReviewDialog(prev => ({ ...prev, isOpen: true }))
		}
	}, [reviewDialog.reviewId])

	const closeReviewDialog = useCallback(() => {
		const shouldReopenTopic = topicDialog.topicId !== undefined

		// Close review dialog and clear its ID
		setReviewDialog({ isOpen: false, reviewId: undefined })

		// If topic was previously open, reopen it
		if (shouldReopenTopic) {
			setTopicDialog(prev => ({ ...prev, isOpen: true }))
		}
	}, [topicDialog.topicId])

	const maximizeTopicDialog = useCallback(() => {
		// Clear everything so nothing reopens
		setTopicDialog({ isOpen: false, topicId: undefined })
		setReviewDialog({ isOpen: false, reviewId: undefined })
	}, [])

	const contextValue = useMemo(
		() => ({
			topicDialogState: topicDialog,
			reviewDialogState: reviewDialog,
			openTopicDialog,
			closeTopicDialog,
			maximizeTopicDialog,
			openReviewDialog,
			closeReviewDialog
		}),
		[
			topicDialog,
			reviewDialog,
			openTopicDialog,
			closeTopicDialog,
			maximizeTopicDialog,
			openReviewDialog,
			closeReviewDialog
		]
	)

	return (
		<ReviewTopicDialogContext value={contextValue}>
			{children}
			<TopicDialog />
			<ReviewDialog />
		</ReviewTopicDialogContext>
	)
}
