import { useContext } from 'react'
import { ReviewSessionTopicDialogContext } from '../stores/ReviewSessionTopicDialogContext'

export function useReviewTopicDialog() {
	const context = useContext(ReviewSessionTopicDialogContext)
	if (!context) {
		throw new Error(
			// biome-ignore lint/nursery/noSecrets: This is not a secret, it's an error message
			'useReviewTopicDialog must be used within ReviewSessionTopicDialogProvider'
		)
	}
	return context
}
