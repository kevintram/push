import { createFileRoute } from '@tanstack/react-router'

import { ReviewLatePage } from '~/app/pages/ReviewLatePage'
import { reviewCardQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/review/late')({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(
			reviewCardQueries.list({ due: 'late' }),
		),
	component: ReviewLatePage,
})
