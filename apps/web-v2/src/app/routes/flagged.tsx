import { createFileRoute } from '@tanstack/react-router'

import { FlaggedPage } from '~/app/pages/FlaggedPage'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'

export const Route = createFileRoute('/flagged')({
	component: FlaggedPage,
	loader: ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		return queryClient.ensureQueryData(reviewCardQueries.listFlagged())
	},
})
