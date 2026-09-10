import { createFileRoute } from '@tanstack/react-router'

import { ReviewDuePage } from '~/app/pages/ReviewPages/ReviewDuePage'

export const Route = createFileRoute('/review/due')({
	component: ReviewDuePage,
})
