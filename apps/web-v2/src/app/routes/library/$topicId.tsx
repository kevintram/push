import type { Id } from '@convex/_generated/dataModel'
import { createFileRoute } from '@tanstack/react-router'

import { TopicPage } from '~/app/pages/TopicPage'
import { topicQueries } from '~/modules/library/api/topicQueries'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'

export const Route = createFileRoute('/library/$topicId')({
	component: TopicPage,
	// The path segment is only ever a topic document id, so brand it once here
	// instead of casting at every consumer.
	params: {
		parse: (params: { topicId: string }) => ({
			topicId: params.topicId as Id<'topics'>,
		}),
		stringify: (params: { topicId: Id<'topics'> }) => ({
			topicId: params.topicId,
		}),
	},
	loader: async ({ context: { auth, queryClient }, params }) => {
		if (!auth.isAuthenticated) return

		await Promise.all([
			queryClient.ensureQueryData(topicQueries.detail(params.topicId)),
			queryClient.ensureQueryData(
				reviewCardQueries.listByTopic(params.topicId),
			),
		])
	},
})
