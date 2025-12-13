import { createFileRoute } from '@tanstack/react-router'
import { ReviewDetailPage } from '~/app/pages/ReviewDetailPage'

export const Route = createFileRoute('/_main/reviews/$reviewId')({
	component: RouteComponent
})

function RouteComponent() {
	const { reviewId } = Route.useParams()
	return <ReviewDetailPage reviewId={reviewId} />
}
