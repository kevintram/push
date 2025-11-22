import { createFileRoute } from '@tanstack/react-router'
import { ReviewsPage } from '~/features/reviews'

export const Route = createFileRoute('/')({
	component: ReviewsPage
})
