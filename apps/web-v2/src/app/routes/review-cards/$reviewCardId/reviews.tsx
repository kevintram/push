import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageReviews } from '~/app/pages/ReviewCardPage/ReviewCardPageReviews'

export const Route = createFileRoute('/review-cards/$reviewCardId/reviews')({
	component: ReviewCardPageReviews,
})
