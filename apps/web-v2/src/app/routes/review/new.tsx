import { createFileRoute } from '@tanstack/react-router'

import { ReviewNewPage } from '~/app/pages/ReviewPages/ReviewNewPage'
import { cardQueries } from '~/modules/reviews/api/cardQueries'

export const Route = createFileRoute('/review/new')({
	component: ReviewNewPage,
	loader: ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		return queryClient.ensureQueryData(cardQueries.listNew())
	},
})
