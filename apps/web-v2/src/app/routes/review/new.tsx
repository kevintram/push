import { createFileRoute } from '@tanstack/react-router'

import { ReviewNewPage } from '~/app/pages/ReviewPages/ReviewNewPage'
import { dueQueries } from '~/modules/reviews/api/dueQueries'

export const Route = createFileRoute('/review/new')({
	component: ReviewNewPage,
	loader: ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		return queryClient.ensureQueryData(dueQueries.listNew())
	},
})
