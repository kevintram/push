import { createFileRoute } from '@tanstack/react-router'
import { TopicDetailPage } from '~/app/pages/TopicDetailPage'

export const Route = createFileRoute('/_main/topics_/$topicId/practice')({
	component: RouteComponent
})

function RouteComponent() {
	const { topicId } = Route.useParams()
	return <TopicDetailPage activeTab='practice' topicId={topicId} />
}
