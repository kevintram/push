import { createFileRoute } from '@tanstack/react-router'

import { ReviewPageLayout } from '~/app/pages/ReviewPageLayout'

export const Route = createFileRoute('/review')({
	component: ReviewPageLayout,
})
