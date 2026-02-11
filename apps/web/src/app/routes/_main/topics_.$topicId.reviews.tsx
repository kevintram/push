import { createFileRoute } from '@tanstack/react-router'
import { TopicReviewsPage } from '~/app/pages/TopicReviewsPage'

export const Route = createFileRoute('/_main/topics_/$topicId/reviews')({
	component: RouteComponent
})

function RouteComponent() {
	const { topicId } = Route.useParams()
	return <TopicReviewsPage topicId={topicId} />
}
