import { createFileRoute } from '@tanstack/react-router'

import { ReviewCardPageLayout } from '~/app/pages/ReviewCardpage/ReviewCardPageLayout'

export const Route = createFileRoute('/library/$topicId_/$reviewCardId')({
	component: ReviewCardPageLayout,
})
