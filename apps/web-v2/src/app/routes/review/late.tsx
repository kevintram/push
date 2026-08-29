import { createFileRoute } from '@tanstack/react-router'

import { ReviewLatePage } from '~/app/pages/ReviewPages/ReviewLatePage'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { todayIso } from '~/utils/date'

export const Route = createFileRoute('/review/late')({
	component: ReviewLatePage,
	loader: ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		return queryClient.ensureQueryData(dueQueries.listLate(todayIso()))
	},
})
