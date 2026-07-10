import { createFileRoute } from '@tanstack/react-router'

import { ReviewLatePage } from '~/app/pages/ReviewLatePage'
import { getReviewCardsParams } from '~/modules/reviews/api/getReviewCards'

export const Route = createFileRoute('/review/late')({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(
			getReviewCardsParams({ due: 'late' }),
		),
	component: ReviewLatePage,
})
