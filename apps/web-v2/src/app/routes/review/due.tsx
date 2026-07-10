import { createFileRoute } from '@tanstack/react-router'

import { ReviewDuePage } from '~/app/pages/ReviewDuePage'
import { getReviewCardsParams } from '~/modules/reviews/api/getReviewCards'
import { getTodayAsString } from '~/utils/date'

export const Route = createFileRoute('/review/due')({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(
			getReviewCardsParams({ due: getTodayAsString() }),
		),
	component: ReviewDuePage,
})
