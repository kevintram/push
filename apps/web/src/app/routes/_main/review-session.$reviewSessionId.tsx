import { createFileRoute } from '@tanstack/react-router'
import { ReviewDetailPage } from '~/app/pages/ReviewDetailPage'

export const Route = createFileRoute('/_main/review-session/$reviewSessionId')({
	component: RouteComponent
})

function RouteComponent() {
	const { reviewSessionId } = Route.useParams()
	return <ReviewDetailPage reviewId={reviewSessionId} />
}
