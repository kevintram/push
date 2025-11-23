import { createFileRoute } from '@tanstack/react-router'
import { ReviewPage } from '~/features/reviews'

export const Route = createFileRoute('/')({
	component: ReviewPage
})
