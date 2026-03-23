import { useContext } from 'react'
import { ReviewDialogContext } from '../providers/ReviewDialogProvider'

export function useReviewDialog() {
	const context = useContext(ReviewDialogContext)
	if (!context) {
		// biome-ignore lint/security/noSecrets: false positive on static invariant message
		throw new Error('useReviewDialog must be used within ReviewDialogProvider')
	}
	return context
}
