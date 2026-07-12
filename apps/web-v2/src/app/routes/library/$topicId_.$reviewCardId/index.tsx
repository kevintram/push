import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageOverview } from '~/app/pages/ReviewCardPage/ReviewCardPageOverview'
import { reviewCardQueries, reviewQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/library/$topicId_/$reviewCardId/')({
	loader: ({ context, params }) => {
		return Promise.all([
			context.queryClient.ensureQueryData(
				reviewCardQueries.detail(params.reviewCardId),
			),
			context.queryClient.ensureQueryData(
				reviewQueries.list({
					reviewCardId: params.reviewCardId,
					order: 'desc',
				}),
			),
		])
	},
	component: ReviewCardPageOverview,
})
