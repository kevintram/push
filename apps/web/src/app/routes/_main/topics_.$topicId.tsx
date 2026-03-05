import { createFileRoute } from '@tanstack/react-router'
import { TopicDetailPage } from '~/app/pages/TopicDetailPage'

export const Route = createFileRoute('/_main/topics_/$topicId')({
	component: TopicDetailRoute
})

function TopicDetailRoute() {
	const { topicId } = Route.useParams()
	return <TopicDetailPage topicId={Number(topicId)} />
}
