import { useCallback } from 'react'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useDeleteReview } from '~/features/reviews/api/deleteReview'
import { useUpdateReview } from '~/features/reviews/api/updateReview'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import type { Rating } from '../../types/review.types'
import { useAddTopicToReview } from './AddTopicToReviewContext'
import { ReviewStatusButton } from './ReviewStatusButton'

interface AddTopicCardProps {
	topic: Topic
	onCardClick: (topic: Topic) => void
	searchQuery?: string
	onRemoveRelationship?: () => void
	onTopicUpdateSuccess?: (updatedTopic: Topic) => void
}

const MIN_HEIGHT = 72

export function AddTopicCard({
	topic,
	onCardClick,
	searchQuery,
	onRemoveRelationship,
	onTopicUpdateSuccess
}: AddTopicCardProps) {
	// Get shared state from context
	const { review, isReviewCompleted, isTopicAdded, getReview } =
		useAddTopicToReview()

	// Mutations
	const createReviewMutation = useCreateReview()
	const deleteReviewMutation = useDeleteReview()
	const updateReviewMutation = useUpdateReview()

	const isAdded = isTopicAdded(topic.id)
	const topicReviewData = getReview(topic.id)
	const rating = topicReviewData?.rating
	const topicReviewId = topicReviewData?.id

	// Click handlers
	const handleAdd = useCallback(() => {
		if (!review) return

		const ratingValue: Rating | null = isReviewCompleted ? 'good' : null
		const payload = {
			review_session_id: review.id,
			topic_id: topic.id,
			rating: ratingValue
		}

		createReviewMutation.mutateAsync(payload)
	}, [review, isReviewCompleted, topic.id, createReviewMutation])

	const handleRemove = useCallback(() => {
		if (topicReviewId) {
			deleteReviewMutation.mutateAsync(topicReviewId)
		}
	}, [topicReviewId, deleteReviewMutation])

	const handleRatingChange = useCallback(
		(newRating: Rating) => {
			if (topicReviewId) {
				updateReviewMutation.mutateAsync({
					id: topicReviewId,
					rating: newRating
				})
			}
		},
		[topicReviewId, updateReviewMutation]
	)

	return (
		<TopicCard
			headerLeft={
				<ReviewStatusButton
					isAdded={isAdded}
					isLoading={
						createReviewMutation.isPending ||
						deleteReviewMutation.isPending ||
						updateReviewMutation.isPending
					}
					isReviewCompleted={isReviewCompleted}
					onAdd={handleAdd}
					onRatingChange={handleRatingChange}
					onRemove={handleRemove}
					rating={rating}
				/>
			}
			headerRight={
				<TopicActionMenu
					onRemoveRelationship={onRemoveRelationship}
					onTopicUpdateSuccess={onTopicUpdateSuccess}
					topic={topic}
				/>
			}
			minHeight={MIN_HEIGHT}
			onTopicClick={onCardClick}
			searchQuery={searchQuery}
			topic={topic}
		/>
	)
}
