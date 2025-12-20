import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useDeleteReview } from '~/features/reviews/api/deleteReview'
import { useUpdateReview } from '~/features/reviews/api/updateReview'
import { useAddTopicToReview } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicToReviewContext'
import { useTopicWithRelationships } from '~/features/topics/api/getTopic'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { TopicDetail } from '~/features/topics/components/TopicDetail/TopicDetail'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/features/topics/types/topic.types'
import type { Rating } from '../../types/review.types'
import { AddTopicCard } from './AddTopicCard'
import { ReviewStatusButton } from './ReviewStatusButton'

interface TopicDetailInReviewModeProps {
	topicId: number
	onTopicSelected: (topicId: number) => void
}

export function TopicDetailInReviewMode({
	topicId,
	onTopicSelected
}: TopicDetailInReviewModeProps) {
	const queryClient = useQueryClient()
	const { review, isReviewCompleted, isTopicAdded, getReview } =
		useAddTopicToReview()

	// Mutations
	const createReviewMutation = useCreateReview()
	const deleteReviewMutation = useDeleteReview()
	const updateReviewMutation = useUpdateReview()

	const router = useRouter()

	const { topic: selectedTopic, isLoading: isLoadingTopic } =
		useTopicWithRelationships(topicId)

	const isSelectedTopicAdded = selectedTopic
		? isTopicAdded(selectedTopic.id)
		: false
	const selectedReview = selectedTopic ? getReview(selectedTopic.id) : undefined

	const handleAddToReview = useCallback(async () => {
		if (!(selectedTopic && review)) return

		const ratingValue: Rating | null = isReviewCompleted ? 'good' : null
		await createReviewMutation.mutateAsync({
			review_session_id: review.id,
			topic_id: selectedTopic.id,
			rating: ratingValue
		})
	}, [selectedTopic, review, isReviewCompleted, createReviewMutation])

	const handleRemoveFromReview = useCallback(async () => {
		if (!selectedReview) return
		await deleteReviewMutation.mutateAsync(selectedReview.id)
	}, [selectedReview, deleteReviewMutation])

	const handleRatingChange = useCallback(
		async (rating: Rating) => {
			if (!selectedReview) return
			await updateReviewMutation.mutateAsync({
				id: selectedReview.id,
				rating
			})
		},
		[selectedReview, updateReviewMutation]
	)

	const onBack = useCallback(() => {
		router.history.back()
	}, [router])

	const handleTopicDeleted = useCallback(() => {
		router.history.back()
	}, [router])

	const handleChildTopicUpdateSuccess = useCallback(
		(updatedTopic: Topic) => {
			queryClient.setQueryData(
				topicKeys.children(topicId),
				(old: Array<Topic>) => {
					return old.map(child => {
						if (child.id === updatedTopic.id) {
							return updatedTopic
						}
						return child
					})
				}
			)
		},
		[queryClient, topicId]
	)

	const handleRelatedTopicUpdateSuccess = useCallback(
		(updatedTopic: Topic) => {
			queryClient.setQueryData(
				topicKeys.related(topicId),
				(old: Array<Topic>) => {
					return old.map(topic => {
						if (topic.id === updatedTopic.id) {
							return updatedTopic
						}
						return topic
					})
				}
			)
		},
		[queryClient, topicId]
	)

	// Custom card renderer for children panel in review mode
	const renderChildCard = useCallback(
		(topic: Topic, onRemove: () => void, onClick: () => void) => (
			<AddTopicCard
				onCardClick={() => onClick()}
				onRemoveRelationship={onRemove}
				onTopicUpdateSuccess={handleChildTopicUpdateSuccess}
				topic={topic}
			/>
		),
		[handleChildTopicUpdateSuccess]
	)

	// Custom card renderer for related panel in review mode
	const renderRelatedCard = useCallback(
		(topic: Topic, onRemove: () => void, onClick: () => void) => (
			<AddTopicCard
				onCardClick={() => onClick()}
				onRemoveRelationship={onRemove}
				onTopicUpdateSuccess={handleRelatedTopicUpdateSuccess}
				topic={topic}
			/>
		),
		[handleRelatedTopicUpdateSuccess]
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
				className='mx-auto max-w-5xl'
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
						<ReviewStatusButton
							isAdded={isSelectedTopicAdded}
							isLoading={
								createReviewMutation.isPending ||
								deleteReviewMutation.isPending ||
								updateReviewMutation.isPending
							}
							isReviewCompleted={isReviewCompleted}
							onAdd={handleAddToReview}
							onRatingChange={selectedReview ? handleRatingChange : undefined}
							onRemove={handleRemoveFromReview}
							rating={selectedReview?.rating}
						/>
					</>
				}
				isLoading={isLoadingTopic}
				onDelete={handleTopicDeleted}
				onTopicNavigate={onTopicSelected}
				renderChildCard={renderChildCard}
				renderRelatedCard={renderRelatedCard}
				sidebarReadonly={true}
				topic={selectedTopic}
			/>
		</TopicContext>
	)
}
