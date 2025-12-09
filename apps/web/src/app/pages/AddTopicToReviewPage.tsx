import { useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useReviewWithTopics } from '~/features/reviews/api/getReview'
import { AddTopicToReviewContent } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicToReviewContent'
import { AddTopicToReviewProvider } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicToReviewContext'

interface AddTopicToReviewPageProps {
	reviewId: string
}

export function AddTopicToReviewPage({ reviewId }: AddTopicToReviewPageProps) {
	const router = useRouter()
	const { review } = useReviewWithTopics(Number.parseInt(reviewId, 10))

	const handleClose = useCallback(() => {
		router.history.back()
	}, [router])

	return (
		<AddTopicToReviewProvider review={review}>
			<AddTopicToReviewContent onClose={handleClose} />
		</AddTopicToReviewProvider>
	)
}
