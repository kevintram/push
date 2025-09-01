import { createFileRoute } from '@tanstack/react-router'
import { TopicHub } from '~/features/topic-hub'

export const Route = createFileRoute('/topics/{-$topicId}')({
	component: RouteComponent
})

function RouteComponent() {
	const { topicId } = Route.useParams()

	return (
		<TopicHub topicId={topicId ? Number.parseInt(topicId, 10) : undefined} />
	)
}
