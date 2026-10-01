import { createFileRoute } from '@tanstack/react-router'

import { ReviewPageLayout } from '~/app/pages/ReviewPages/ReviewPageLayout'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { todayIso } from '~/utils/date'

export const Route = createFileRoute('/review')({
	component: ReviewPageLayout,
	loader: async ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		const today = todayIso()

		await Promise.all([
			queryClient.ensureQueryData(dueQueries.listDue(today)),
			queryClient.ensureQueryData(dueQueries.listNew()),
			queryClient.ensureQueryData(dueQueries.listLate(today)),
			queryClient.ensureQueryData(cardQueries.listFlagged()),
		])
	},
})
