import { createContext } from 'react'

export interface ReviewTopicDialogContextValue {
	// State
	topicDialogState: { isOpen: boolean; topicId: number | undefined }
	reviewDialogState: { isOpen: boolean; reviewId: number | undefined }

	// Topic actions
	openTopicDialog: (topicId: number) => void
	closeTopicDialog: () => void
	maximizeTopicDialog: () => void

	// ReviewSession actions
	openReviewDialog: (reviewId: number) => void
	closeReviewDialog: () => void
	maximizeReviewDialog: () => void
}

export const ReviewTopicDialogContext =
	createContext<ReviewTopicDialogContextValue | null>(null)
