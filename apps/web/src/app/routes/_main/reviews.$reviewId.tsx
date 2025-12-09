import { createFileRoute } from '@tanstack/react-router'
import { ReviewPage } from '~/app/pages/ReviewPage'

export const Route = createFileRoute('/_main/reviews/$reviewId')({
	component: RouteComponent
})

function RouteComponent() {
	const { reviewId } = Route.useParams()
	return <ReviewPage reviewId={reviewId} />
}
