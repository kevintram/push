import { useNavigate } from '@tanstack/react-router'
import { LoadingOrError } from '~/components/LoadingOrError'
import { useTopicWithRelationships } from '~/features/topics/api/getTopic'
import { EntityReviewsPageContent } from './EntityReviewsPageContent'

interface TopicReviewsPageProps {
	topicId: string
}

export function TopicReviewsPage({ topicId }: TopicReviewsPageProps) {
	const navigate = useNavigate()
	const parsedTopicId = Number.parseInt(topicId, 10)
	const { topic, isLoading } = useTopicWithRelationships(parsedTopicId)

	if (isLoading) {
		return <LoadingOrError />
	}

	if (!topic) {
		return <LoadingOrError error={new Error('Topic not found')} />
	}

	return (
		<EntityReviewsPageContent
			entityId={topic.id}
			entityName={topic.name}
			entityType='topic'
			onBack={() =>
				navigate({
					to: '/topics/$topicId',
					params: { topicId }
				})
			}
		/>
	)
}
