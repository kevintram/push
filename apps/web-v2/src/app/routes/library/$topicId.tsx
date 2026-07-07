import { createFileRoute } from '@tanstack/react-router'

import { TopicPage } from '~/modules/library/components/TopicPage'
import topics from '~/modules/library/mock-data/topics.json'
import type { Topic } from '~/modules/library/types/topic.types'

// Temporary testing measure: DFS through mock topics to find the current route.
function findTopicById(
	topicsToSearch: Array<Topic>,
	topicId: string,
): Topic | undefined {
	for (const topic of topicsToSearch) {
		if (topic.slug === topicId || String(topic.id) === topicId) {
			return topic
		}

		const childTopic = findTopicById(topic.children, topicId)

		if (childTopic) {
			return childTopic
		}
	}

	return undefined
}

export const Route = createFileRoute('/library/$topicId')({
	component: RouteComponent,
})

function RouteComponent() {
	const { topicId } = Route.useParams()
	const topic = findTopicById(topics as Array<Topic>, topicId)

	if (!topic) {
		return <div>Topic not found.</div>
	}

	return <TopicPage {...topic} />
}
