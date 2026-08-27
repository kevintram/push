import { createFileRoute } from '@tanstack/react-router'

import { ReviewDuePage } from '~/app/pages/ReviewPages/ReviewDuePage'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { todayIso } from '~/utils/date'

export const Route = createFileRoute('/review/due')({
	component: ReviewDuePage,
	loader: ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		return queryClient.ensureQueryData(dueQueries.list(todayIso()))
	},
})
