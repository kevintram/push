import { createFileRoute } from '@tanstack/react-router'
import { RootTopicsPage } from '~/features/topics/components/RootTopicsPage'
import { TopicPage } from '~/features/topics/components/TopicPage/TopicPage'

export const Route = createFileRoute('/topics/{-$topicId}')({
	component: RouteComponent
})

function RouteComponent() {
	const { topicId } = Route.useParams()

	if (!topicId) {
		return <RootTopicsPage />
	}

	return <TopicPage topicId={Number.parseInt(topicId, 10)} />
}
