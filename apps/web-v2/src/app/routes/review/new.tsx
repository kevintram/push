import { createFileRoute } from '@tanstack/react-router'

import { ReviewNewPage } from '~/app/pages/ReviewNewPage'
import { reviewCardQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/review/new')({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(
			reviewCardQueries.list({ due: 'new' }),
		),
	component: ReviewNewPage,
})
