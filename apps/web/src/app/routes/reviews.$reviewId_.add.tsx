import { createFileRoute } from '@tanstack/react-router'
import { AddTopicToReviewPage } from '~/app/pages/AddTopicToReviewPage'

export const Route = createFileRoute('/reviews/$reviewId_/add')({
	component: RouteComponent
})

function RouteComponent() {
	const { reviewId } = Route.useParams()
	return <AddTopicToReviewPage reviewId={reviewId} />
}
