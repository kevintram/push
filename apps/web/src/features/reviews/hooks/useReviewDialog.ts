import { useContext } from 'react'
import { ReviewDialogContext } from '../providers/ReviewDialogProvider'

export function useReviewDialog() {
	const context = useContext(ReviewDialogContext)
	if (!context) {
		throw new Error('useReviewDialog must be used within ReviewDialogProvider')
	}
	return context
}
