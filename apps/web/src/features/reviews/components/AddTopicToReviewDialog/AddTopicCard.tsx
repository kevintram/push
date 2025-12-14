import { useCallback } from 'react'
import { useCreateTopicReview } from '~/features/reviews/api/createTopicReview'
import { useDeleteTopicReview } from '~/features/reviews/api/deleteTopicReview'
import { useUpdateTopicReview } from '~/features/reviews/api/updateTopicReview'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import type { Rating } from '../../types/review.types'
import { useAddTopicToReview } from './AddTopicToReviewContext'
import { TopicReviewStatusButton } from './ReviewStatusButton'

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
	const { review, isReviewCompleted, isTopicAdded, getTopicReview } =
		useAddTopicToReview()

	// Mutations
	const createTopicReviewMutation = useCreateTopicReview()
	const deleteTopicReviewMutation = useDeleteTopicReview()
	const updateTopicReviewMutation = useUpdateTopicReview()

	const isAdded = isTopicAdded(topic.id)
	const topicReviewData = getTopicReview(topic.id)
	const rating = topicReviewData?.rating
	const topicReviewId = topicReviewData?.id

	// Click handlers
	const handleAdd = useCallback(() => {
		if (!review) return

		const ratingValue: Rating | null = isReviewCompleted ? 'good' : null
		const payload = {
			review_id: review.id,
			topic_id: topic.id,
			rating: ratingValue
		}

		createTopicReviewMutation.mutateAsync(payload)
	}, [review, isReviewCompleted, topic.id, createTopicReviewMutation])

	const handleRemove = useCallback(() => {
		if (topicReviewId) {
			deleteTopicReviewMutation.mutateAsync(topicReviewId)
		}
	}, [topicReviewId, deleteTopicReviewMutation])

	const handleRatingChange = useCallback(
		(newRating: Rating) => {
			if (topicReviewId) {
				updateTopicReviewMutation.mutateAsync({
					id: topicReviewId,
					rating: newRating
				})
			}
		},
		[topicReviewId, updateTopicReviewMutation]
	)

	return (
		<TopicCard
			headerLeft={
				<TopicReviewStatusButton
					isAdded={isAdded}
					isLoading={
						createTopicReviewMutation.isPending ||
						deleteTopicReviewMutation.isPending ||
						updateTopicReviewMutation.isPending
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
