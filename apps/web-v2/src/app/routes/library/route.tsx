import { createFileRoute } from '@tanstack/react-router'

import { LibraryPageLayout } from '~/app/pages/LibraryPageLayout'
import { topicQueries } from '~/modules/library/api/queries'

export const Route = createFileRoute('/library')({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(topicQueries.list()),
	component: LibraryPageLayout,
})
