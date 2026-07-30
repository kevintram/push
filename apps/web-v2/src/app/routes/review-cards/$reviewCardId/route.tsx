import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageLayout } from '~/app/pages/ReviewCardPage/ReviewCardPageLayout'

export const Route = createFileRoute('/review-cards/$reviewCardId')({
	component: ReviewCardPageLayout,
})
