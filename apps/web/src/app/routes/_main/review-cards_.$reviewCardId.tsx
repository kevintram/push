import { createFileRoute } from '@tanstack/react-router'
import { ReviewCardDetailPage } from '~/app/pages/ReviewCardDetailPage'

export const Route = createFileRoute('/_main/review-cards_/$reviewCardId')({
	component: RouteComponent
})

function RouteComponent() {
	const { reviewCardId } = Route.useParams()
	return <ReviewCardDetailPage reviewCardId={Number(reviewCardId)} />
}
