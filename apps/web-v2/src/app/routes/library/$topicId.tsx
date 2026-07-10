import { createFileRoute } from '@tanstack/react-router'

import { TopicPage } from '~/app/pages/TopicPage'
import { topicQueries } from '~/modules/library/api/queries'

export const Route = createFileRoute('/library/$topicId')({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(
			topicQueries.detail(params.topicId),
		),
	component: TopicPage,
})
