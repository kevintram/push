import { createFileRoute } from '@tanstack/react-router'

import { ReviewNewPage } from '~/app/pages/ReviewNewPage'
import { getReviewCardsParams } from '~/modules/reviews/api/getReviewCards'

export const Route = createFileRoute('/review/new')({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(
			getReviewCardsParams({ due: 'new' }),
		),
	component: ReviewNewPage,
})
