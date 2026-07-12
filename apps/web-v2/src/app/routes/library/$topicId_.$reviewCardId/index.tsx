import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageOverview } from '~/app/pages/ReviewCardpage/ReviewCardPageOverview'
import { reviewCardQueries, reviewQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/library/$topicId_/$reviewCardId/')({
	loader: ({ context, params }) => {
		const reviewCardQuery = context.queryClient.ensureQueryData(
			reviewCardQueries.detail(params.reviewCardId),
		)
		const reviewsQuery = context.queryClient.ensureQueryData(
			reviewQueries.list({
				reviewCardId: params.reviewCardId,
				order: 'desc',
			}),
		)
		return Promise.all([reviewCardQuery, reviewsQuery])
	},
	component: ReviewCardPageOverview,
})
