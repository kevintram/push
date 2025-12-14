import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { useCreateTopicReview } from '~/features/reviews/api/createTopicReview'
import { useDeleteTopicReview } from '~/features/reviews/api/deleteTopicReview'
import { useUpdateTopicReview } from '~/features/reviews/api/updateTopicReview'
import { useAddTopicToReview } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicToReviewContext'
import { useTopicWithRelationships } from '~/features/topics/api/getTopic'
import { topicKeys } from '~/features/topics/api/queryKeys'
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
	const queryClient = useQueryClient()
	const { review, isReviewCompleted, isTopicAdded, getTopicReview } =
		useAddTopicToReview()

	// Mutations
	const createTopicReviewMutation = useCreateTopicReview()
	const deleteTopicReviewMutation = useDeleteTopicReview()
	const updateTopicReviewMutation = useUpdateTopicReview()

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
		if (!(selectedTopic && review)) return

		const ratingValue: Rating | null = isReviewCompleted ? 'good' : null
		await createTopicReviewMutation.mutateAsync({
			review_id: review.id,
			topic_id: selectedTopic.id,
			rating: ratingValue
		})
	}, [selectedTopic, review, isReviewCompleted, createTopicReviewMutation])

	const handleRemoveFromReview = useCallback(async () => {
		if (!selectedTopicReview) return
		await deleteTopicReviewMutation.mutateAsync(selectedTopicReview.id)
	}, [selectedTopicReview, deleteTopicReviewMutation])

	const handleRatingChange = useCallback(
		async (rating: Rating) => {
			if (!selectedTopicReview) return
			await updateTopicReviewMutation.mutateAsync({
				id: selectedTopicReview.id,
				rating
			})
		},
		[selectedTopicReview, updateTopicReviewMutation]
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
						<TopicReviewStatusButton
							isAdded={isSelectedTopicAdded}
							isLoading={
								createTopicReviewMutation.isPending ||
								deleteTopicReviewMutation.isPending ||
								updateTopicReviewMutation.isPending
							}
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
				renderRelatedCard={renderRelatedCard}
				sidebarReadonly={true}
				topic={selectedTopic}
			/>
		</TopicContext>
	)
}
