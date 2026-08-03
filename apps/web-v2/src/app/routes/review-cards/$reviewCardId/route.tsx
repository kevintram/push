import type { Id } from '@convex/_generated/dataModel'
import { createFileRoute, notFound } from '@tanstack/react-router'

import { ReviewCardPageLayout } from '~/app/pages/ReviewCardPage/ReviewCardPageLayout'
import { reviewCardQueries } from '~/modules/reviews'

export const Route = createFileRoute('/review-cards/$reviewCardId')({
	component: ReviewCardPageLayout,
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

		const reviewCard = await queryClient.ensureQueryData(
			reviewCardQueries.detail(params.reviewCardId),
		)

		if (!reviewCard) throw notFound()
	},
})
