import { createFileRoute } from '@tanstack/react-router'

import { ReviewFlaggedPage } from '~/app/pages/ReviewPages/ReviewFlaggedPage'

export const Route = createFileRoute('/review/flagged')({
	component: ReviewFlaggedPage,
})
