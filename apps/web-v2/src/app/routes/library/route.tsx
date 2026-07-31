import { createFileRoute } from '@tanstack/react-router'

import { LibraryPageLayout } from '~/app/pages/LibraryPageLayout'
import { topicQueries } from '~/modules/library'

export const Route = createFileRoute('/library')({
	component: LibraryPageLayout,
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(topicQueries.list()),
})
