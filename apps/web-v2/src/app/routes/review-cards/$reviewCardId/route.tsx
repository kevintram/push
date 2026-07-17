import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageLayout } from '~/app/pages/ReviewCardPage/ReviewCardPageLayout'
import { topicQueries } from '~/modules/library/api/queries'
import { reviewCardQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/review-cards/$reviewCardId')({
	loader: async ({ context, params }) => {
		const reviewCard = await context.queryClient.ensureQueryData(
			reviewCardQueries.detail(params.reviewCardId),
		)
		const topicId = String(reviewCard.topic_id)

		await context.queryClient.ensureQueryData(topicQueries.detail(topicId))

		return { topicId }
	},
	component: ReviewCardPageLayout,
})
