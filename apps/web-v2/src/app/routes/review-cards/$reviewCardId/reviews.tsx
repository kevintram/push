import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageReviews } from '~/app/pages/ReviewCardPage/ReviewCardPageReviews'
import { reviewQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/review-cards/$reviewCardId/reviews')({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(
			reviewQueries.list({
				reviewCardId: params.reviewCardId,
				order: 'desc',
			}),
		),
	component: ReviewCardPageReviews,
})
