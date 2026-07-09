import { createFileRoute } from '@tanstack/react-router'

import { ReviewNewPage } from '~/app/pages/ReviewNewPage'

export const Route = createFileRoute('/review/new')({
	component: ReviewNewPage,
})
