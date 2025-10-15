import { createFileRoute } from '@tanstack/react-router'
import { TopicHub } from '~/features/topic-hub'
import { RootTopicsPage } from '~/features/topic-hub/components/RootTopicsPage'

export const Route = createFileRoute('/topics/{-$topicId}')({
	component: RouteComponent
})

function RouteComponent() {
	const { topicId } = Route.useParams()

	if (!topicId) {
		return <RootTopicsPage />
	}

	return (
		<TopicHub topicId={topicId ? Number.parseInt(topicId, 10) : undefined} />
	)
}
