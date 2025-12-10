import { useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { useAddTopicToReview } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicToReviewContext'
import { useTopicWithRelationships } from '~/features/topics/api/getTopic'
import { TopicDetail } from '~/features/topics/components/TopicDetail/TopicDetail'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/features/topics/types/topic.types'
import type { Rating } from '../../types/review.types'
import { AddTopicCard } from './AddTopicCard'
import { TopicReviewStatusButton } from './ReviewStatusButton'

interface TopicDetailInReviewModeProps {
	topicId: number
	onTopicSelected: (topicId: number) => void
}

export function TopicDetailInReviewMode({
	topicId,
	onTopicSelected
}: TopicDetailInReviewModeProps) {
	const {
		isReviewCompleted,
		isTopicAdded,
		getTopicReview,
		addTopicToReview,
		removeTopicFromReview,
		updateRating
	} = useAddTopicToReview()

	const router = useRouter()

	const { topic: selectedTopic, isLoading: isLoadingTopic } =
		useTopicWithRelationships(topicId)

	const isSelectedTopicAdded = selectedTopic
		? isTopicAdded(selectedTopic.id)
		: false
	const selectedTopicReview = selectedTopic
		? getTopicReview(selectedTopic.id)
		: undefined

	const handleAddToReview = useCallback(async () => {
		if (!selectedTopic) return
		await addTopicToReview({ topicId: selectedTopic.id })
	}, [selectedTopic, addTopicToReview])

	const handleRemoveFromReview = useCallback(async () => {
		if (!selectedTopic) return
		await removeTopicFromReview(selectedTopic)
	}, [selectedTopic, removeTopicFromReview])

	const handleRatingChange = useCallback(
		async (rating: Rating) => {
			if (!selectedTopicReview) return
			await updateRating(selectedTopicReview.id, rating)
		},
		[selectedTopicReview, updateRating]
	)

	const onBack = useCallback(() => {
		router.history.back()
	}, [router])

	const handleTopicDeleted = useCallback(() => {
		router.history.back()
	}, [router])

	// Custom card renderer for children panel in review mode
	const renderChildCard = useCallback(
		(topic: Topic, onRemove: () => void, onClick: () => void) => (
			<AddTopicCard
				onCardClick={() => onClick()}
				onRemoveRelationship={onRemove}
				topic={topic}
			/>
		),
		[]
	)

	// Context value for TopicDetail (needed because TopicDetail can read from context)
	const topicContextValue = useMemo(
		() => ({
			topic: selectedTopic,
			isLoading: isLoadingTopic
		}),
		[selectedTopic, isLoadingTopic]
	)

	return (
		<TopicContext value={topicContextValue}>
			<TopicDetail
				headerBeforeActions={
					<>
						<Button
							className='h-6 w-6 p-0 text-muted-foreground'
							onClick={onBack}
							size='sm'
							title='Back to topics'
							variant='ghost'
						>
							<ArrowLeft className='h-4 w-4' />
						</Button>
						<TopicReviewStatusButton
							isAdded={isSelectedTopicAdded}
							isReviewCompleted={isReviewCompleted}
							onAdd={handleAddToReview}
							onRatingChange={
								selectedTopicReview ? handleRatingChange : undefined
							}
							onRemove={handleRemoveFromReview}
							rating={selectedTopicReview?.rating}
						/>
					</>
				}
				isLoading={isLoadingTopic}
				onDelete={handleTopicDeleted}
				onTopicNavigate={onTopicSelected}
				renderChildCard={renderChildCard}
				sidebarReadonly={true}
				topic={selectedTopic}
			/>
		</TopicContext>
	)
}
