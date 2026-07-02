import { createFileRoute } from '@tanstack/react-router'

import { ReviewPage } from '~/app/pages/ReviewPage'

export const Route = createFileRoute('/review')({
	component: ReviewPage,
})
