import { createFileRoute } from '@tanstack/react-router'
import { TopicDetailPage } from '~/app/pages/TopicDetailPage'

export const Route = createFileRoute('/topics_/$topicId')({
	component: RouteComponent
})

function RouteComponent() {
	const { topicId } = Route.useParams()
	return <TopicDetailPage topicId={topicId} />
}
