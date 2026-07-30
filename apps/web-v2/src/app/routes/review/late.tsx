import { createFileRoute } from '@tanstack/react-router'

import { ReviewLatePage } from '~/app/pages/ReviewLatePage'

export const Route = createFileRoute('/review/late')({
	component: ReviewLatePage,
})
