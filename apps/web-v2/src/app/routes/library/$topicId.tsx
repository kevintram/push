import { createFileRoute } from '@tanstack/react-router'

import { TopicPage } from '~/app/pages/TopicPage'
import { topicQueries } from '~/modules/library/api/queries'
import { reviewCardQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/library/$topicId')({
	loader: ({ context, params }) =>
		Promise.all([
			context.queryClient.ensureQueryData(
				topicQueries.detail(params.topicId),
			),
			context.queryClient.ensureQueryData(
				reviewCardQueries.list({ topicId: params.topicId }),
			),
		]),
	component: TopicPage,
})
