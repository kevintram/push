import { useCallback } from 'react'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import { useAddTopicToReview } from './AddTopicToReviewContext'
import { TopicReviewStatusButton } from './ReviewStatusButton'

interface AddTopicCardProps {
	topic: Topic
	onCardClick: (topic: Topic) => void
	searchQuery?: string
	onRemoveRelationship?: () => void
}

const MIN_HEIGHT = 72

export function AddTopicCard({
	topic,
	onCardClick,
	searchQuery,
	onRemoveRelationship
}: AddTopicCardProps) {
	// Get shared state from context
	const {
		isReviewCompleted,
		isTopicAdded,
		getTopicReview,
		addTopicToReview: createTopicReview,
		removeTopicFromReview,
		updateRating
	} = useAddTopicToReview()

	const isAdded = isTopicAdded(topic.id)
	const topicReviewData = getTopicReview(topic.id)
	const rating = topicReviewData?.rating
	const topicReviewId = topicReviewData?.id

	// Click handlers
	const handleAdd = useCallback(() => {
		createTopicReview({ topicId: topic.id })
	}, [createTopicReview, topic])

	const handleRemove = useCallback(() => {
		removeTopicFromReview(topic)
	}, [removeTopicFromReview, topic])

	const handleRatingChange = useCallback(
		(newRating: Parameters<typeof updateRating>[1]) => {
			if (topicReviewId) {
				updateRating(topicReviewId, newRating)
			}
		},
		[topicReviewId, updateRating]
	)

	return (
		<TopicCard
			headerLeft={
				<TopicReviewStatusButton
					isAdded={isAdded}
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
