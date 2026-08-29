import { createFileRoute } from '@tanstack/react-router'

import { LibraryPageLayout } from '~/app/pages/LibraryPageLayout'
import { collectionQueries } from '~/modules/library/api/collectionQueries'

export const Route = createFileRoute('/library')({
	component: LibraryPageLayout,
	loader: ({ context: { auth, queryClient } }) => {
		if (!auth.isAuthenticated) return

		return queryClient.ensureQueryData(collectionQueries.list())
	},
})
