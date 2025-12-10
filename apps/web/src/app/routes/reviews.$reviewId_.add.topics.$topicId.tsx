import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'
import { TopicDetailInReviewMode } from '~/features/reviews/components/AddTopicToReviewDialog/TopicDetailInReviewMode'

export const Route = createFileRoute('/reviews/$reviewId_/add/topics/$topicId')(
	{
		component: TopicDetailRouteComponent
	}
)

function TopicDetailRouteComponent() {
	const { topicId, reviewId } = Route.useParams()
	const navigate = Route.useNavigate()

	const handleTopicSelected = useCallback(
		(newTopicId: number) => {
			navigate({
				to: '/reviews/$reviewId/add/topics/$topicId',
				params: { reviewId, topicId: newTopicId.toString() },
				search: old => old
			})
		},
		[navigate, reviewId]
	)

	return (
		<TopicDetailInReviewMode
			onTopicSelected={handleTopicSelected}
			topicId={Number.parseInt(topicId, 10)}
		/>
	)
}
