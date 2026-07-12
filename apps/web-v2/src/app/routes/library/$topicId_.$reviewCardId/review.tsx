import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageReviews } from '~/app/pages/ReviewCardpage/ReviewCardPageReview'
import { reviewQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/library/$topicId_/$reviewCardId/review')(
	{
		loader: ({ context, params }) =>
			context.queryClient.ensureQueryData(
				reviewQueries.list({
					reviewCardId: params.reviewCardId,
					order: 'desc',
				}),
			),
		component: ReviewCardPageReviews,
	},
)
