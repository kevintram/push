import { createFileRoute } from '@tanstack/react-router'

import { ReviewNewPage } from '~/app/pages/ReviewPages/ReviewNewPage'

export const Route = createFileRoute('/review/new')({
	component: ReviewNewPage,
})
