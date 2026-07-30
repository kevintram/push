import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageOverview } from '~/app/pages/ReviewCardPage/ReviewCardPageOverview'

export const Route = createFileRoute('/review-cards/$reviewCardId/')({
	component: ReviewCardPageOverview,
})
