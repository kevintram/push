import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageOverview } from '~/app/pages/ReviewCardPage/ReviewCardPageOverview'
import { reviewQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/review-cards/$reviewCardId/')({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(
			reviewQueries.list({
				reviewCardId: params.reviewCardId,
				order: 'desc',
			}),
		),
	component: ReviewCardPageOverview,
})
