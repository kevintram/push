import { createFileRoute } from '@tanstack/react-router'

import { FlaggedPage } from '~/app/pages/FlaggedPages/FlaggedPage'
import { cardQueries } from '~/modules/reviews/api/cardQueries'

export const Route = createFileRoute('/flagged')({
	component: FlaggedPage,
	loader: ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		return queryClient.ensureQueryData(cardQueries.listFlagged())
	},
})
