import { createFileRoute } from '@tanstack/react-router'

import { LibraryPageLayout } from '~/app/pages/LibraryPageLayout'
import { topicQueries } from '~/modules/library/api/topicQueries'

export const Route = createFileRoute('/library')({
	component: LibraryPageLayout,
	loader: ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		return queryClient.ensureQueryData(topicQueries.list())
	},
})
