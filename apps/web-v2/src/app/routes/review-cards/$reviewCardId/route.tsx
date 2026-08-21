import type { Id } from '@convex/_generated/dataModel'
import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageShell } from '~/app/pages/ReviewCardPage/ReviewCardPageShell'
import { topicQueries } from '~/modules/library/api/topicQueries'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { reviewQueries } from '~/modules/reviews/api/reviewQueries'

export const Route = createFileRoute('/review-cards/$reviewCardId')({
	component: ReviewCardPageShell,
	// The path segment is only ever a review-card document id, so brand it once
	// here instead of casting at every consumer.
	params: {
		parse: (params: { reviewCardId: string }) => ({
			reviewCardId: params.reviewCardId as Id<'reviewCards'>,
		}),
		stringify: (params: { reviewCardId: Id<'reviewCards'> }) => ({
			reviewCardId: params.reviewCardId,
		}),
	},
	loader: async ({ context: { auth, queryClient }, params }) => {
		if (!auth.isAuthenticated) return

		const reviewCard = queryClient.ensureQueryData(
			reviewCardQueries.detail(params.reviewCardId),
		)

		await Promise.all([
			reviewCard,
			queryClient.ensureQueryData(
				reviewQueries.listByReviewCard(params.reviewCardId),
			),
			// The breadcrumb trail is keyed by the card's topic id, so it can
			// only be fired once the card lands. That second hop buys not
			// shipping the user's whole topic list to a route outside
			// `/library`, which has no other use for it.
			reviewCard.then(({ topicId }) =>
				queryClient.ensureQueryData(
					topicQueries.detail(topicId, { expandPath: true }),
				),
			),
		])
	},
})
