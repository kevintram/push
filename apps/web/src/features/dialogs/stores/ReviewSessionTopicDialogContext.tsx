import { createContext } from 'react'

export interface ReviewSessionTopicDialogContextValue {
	// State
	topicDialogState: { isOpen: boolean; topicId: number | undefined }
	reviewSessionDialogState: { isOpen: boolean; reviewId: number | undefined }

	// Topic actions
	openTopicDialog: (topicId: number) => void
	closeTopicDialog: () => void
	maximizeTopicDialog: () => void

	// ReviewSession actions
	openReviewSessionDialog: (reviewId: number) => void
	closeReviewSessionDialog: () => void
	maximizeReviewSessionDialog: () => void
}

export const ReviewSessionTopicDialogContext =
	createContext<ReviewSessionTopicDialogContextValue | null>(null)
