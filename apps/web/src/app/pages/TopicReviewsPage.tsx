import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { LoadingOrError } from '~/components/LoadingOrError'
import { useTopicWithRelationships } from '~/features/topics/api/getTopic'
import { TopicDetailNavBar } from '~/features/topics/components/TopicDetail/TopicDetailNavBar'
import { EntityReviewsPageContent } from './EntityReviewsPageContent'

interface TopicReviewsPageProps {
	topicId: string
}

export function TopicReviewsPage({ topicId }: TopicReviewsPageProps) {
	const navigate = useNavigate()
	const parsedTopicId = Number.parseInt(topicId, 10)
	const { topic, isLoading } = useTopicWithRelationships(parsedTopicId)

	const handleTopicNavigate = useCallback(
		(nextTopicId: number) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: nextTopicId.toString() }
			})
		},
		[navigate]
	)

	if (isLoading) {
		return <LoadingOrError />
	}

	if (!topic) {
		return <LoadingOrError error={new Error('Topic not found')} />
	}

	return (
		<EntityReviewsPageContent
			entityId={topic.id}
			entityType='topic'
			navbar={
				<TopicDetailNavBar
					activeTab='reviews'
					onParentSelect={handleTopicNavigate}
					topic={topic}
				/>
			}
		/>
	)
}
