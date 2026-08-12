import { createFileRoute } from '@tanstack/react-router'

import { ReviewNewPage } from '~/app/pages/ReviewNewPage'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'

export const Route = createFileRoute('/review/new')({
	component: ReviewNewPage,
	loader: ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		return queryClient.ensureQueryData(reviewCardQueries.listNew())
	},
})
