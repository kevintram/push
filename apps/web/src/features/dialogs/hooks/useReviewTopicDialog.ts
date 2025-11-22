import { use } from 'react'
import { ReviewTopicDialogContext } from '../stores/ReviewTopicDialogContext'

export function useReviewTopicDialog() {
	const context = use(ReviewTopicDialogContext)
	if (!context) {
		throw new Error(
			// biome-ignore lint/nursery/noSecrets: This is not a secret, it's an error message
			'useReviewTopicDialog must be used within ReviewTopicDialogProvider'
		)
	}
	return context
}
