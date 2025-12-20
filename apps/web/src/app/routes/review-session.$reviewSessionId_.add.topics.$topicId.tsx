import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'
import { TopicDetailInReviewMode } from '~/features/reviews/components/AddTopicToReviewDialog/TopicDetailInReviewMode'

export const Route = createFileRoute(
	'/review-session/$reviewSessionId_/add/topics/$topicId'
)({
	component: TopicDetailRouteComponent
})

function TopicDetailRouteComponent() {
	const { topicId, reviewSessionId } = Route.useParams()
	const navigate = Route.useNavigate()

	const handleTopicSelected = useCallback(
		(newTopicId: number) => {
			navigate({
				to: '/review-session/$reviewSessionId/add/topics/$topicId',
				params: { reviewSessionId, topicId: newTopicId.toString() },
				search: old => old
			})
		},
		[navigate, reviewSessionId]
	)

	return (
		<TopicDetailInReviewMode
			onTopicSelected={handleTopicSelected}
			topicId={Number.parseInt(topicId, 10)}
		/>
	)
}
