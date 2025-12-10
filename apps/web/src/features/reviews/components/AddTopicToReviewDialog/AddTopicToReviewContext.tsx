import {
	createContext,
	useCallback,
	useContext,
	useMemo
} from 'react'
import { useCreateTopicReview } from '~/features/reviews/api/createTopicReview'
import { useDeleteTopicReview } from '~/features/reviews/api/deleteTopicReview'
import { useUpdateTopicReview } from '~/features/reviews/api/updateTopicReview'
import type { Topic } from '~/features/topics/types/topic.types'
import type { Rating, Review, TopicReview } from '../../types/review.types'

interface AddTopicToReviewContextValue {
	// Review
	review: Review | undefined
	isReviewCompleted: boolean

	// Helpers (for any topic, not just selected)
	isTopicAdded: (topicId: number) => boolean
	getTopicReview: (topicId: number) => TopicReview | undefined

	// Mutations
	addTopicToReview: (
		params:
			| { topicId: number }
			| {
					topic: {
						name: string
						notes: string
						archived: boolean
						inboxed: boolean
					}
			  }
	) => Promise<TopicReview>
	removeTopicFromReview: (topic: Topic) => Promise<void>
	removeTopicReviewById: (topicReviewId: number) => Promise<void>
	updateRating: (topicReviewId: number, rating: Rating) => Promise<void>

	// Mutation state
	isCreatingTopicReview: boolean
}

const AddTopicToReviewContext =
	createContext<AddTopicToReviewContextValue | null>(null)

interface AddTopicToReviewProviderProps {
	review: Review | undefined
	children: React.ReactNode
}

export function AddTopicToReviewProvider({
	review,
	children
}: AddTopicToReviewProviderProps) {
	// Derived review state
	const isReviewCompleted = useMemo(
		() => !!review?.completed_at,
		[review?.completed_at]
	)

	const addedTopics = useMemo(
		() => new Set(review?.topic_reviews?.map(tr => tr.topic_id) ?? []),
		[review?.topic_reviews]
	)

	// Helper functions
	const isTopicAdded = useCallback(
		(topicId: number) => addedTopics.has(topicId),
		[addedTopics]
	)

	const getTopicReview = useCallback(
		(topicId: number) => {
			return review?.topic_reviews?.find(tr => tr.topic_id === topicId)
		},
		[review?.topic_reviews]
	)

	// Mutations
	const createTopicReviewMutation = useCreateTopicReview()
	const deleteTopicReviewMutation = useDeleteTopicReview()
	const updateTopicReviewMutation = useUpdateTopicReview()

	const isCreatingTopicReview = createTopicReviewMutation.isPending

	// Action handlers
	const addTopicToReview = useCallback(
		async (
			params:
				| { topicId: number }
				| {
						topic: {
							name: string
							notes: string
							archived: boolean
							inboxed: boolean
						}
				  }
		) => {
			if (!review) throw new Error('Review is required')

			const rating: Rating | null = isReviewCompleted ? 'good' : null

			const payload =
				'topicId' in params
					? {
							review_id: review.id,
							topic_id: params.topicId,
							rating
						}
					: {
							review_id: review.id,
							topic: params.topic,
							rating
						}

			return await createTopicReviewMutation.mutateAsync(payload)
		},
		[review, createTopicReviewMutation, isReviewCompleted]
	)

	const removeTopicReviewById = useCallback(
		async (topicReviewId: number) => {
			await deleteTopicReviewMutation.mutateAsync(topicReviewId)
		},
		[deleteTopicReviewMutation]
	)

	const removeTopicFromReview = useCallback(
		async (topic: Topic) => {
			const topicReviewData = review?.topic_reviews?.find(
				tr => tr.topic_id === topic.id
			)
			if (topicReviewData) {
				await removeTopicReviewById(topicReviewData.id)
			}
		},
		[review?.topic_reviews, removeTopicReviewById]
	)

	const updateRating = useCallback(
		async (topicReviewId: number, rating: Rating) => {
			await updateTopicReviewMutation.mutateAsync({ id: topicReviewId, rating })
		},
		[updateTopicReviewMutation]
	)

	const value = useMemo<AddTopicToReviewContextValue>(
		() => ({
			review,
			isReviewCompleted,
			isTopicAdded,
			getTopicReview,
			addTopicToReview,
			removeTopicFromReview,
			removeTopicReviewById,
			updateRating,
			isCreatingTopicReview
		}),
		[
			review,
			isReviewCompleted,
			isTopicAdded,
			getTopicReview,
			addTopicToReview,
			removeTopicFromReview,
			removeTopicReviewById,
			updateRating,
			isCreatingTopicReview
		]
	)

	return (
		<AddTopicToReviewContext.Provider value={value}>
			{children}
		</AddTopicToReviewContext.Provider>
	)
}

export function useAddTopicToReview() {
	const context = useContext(AddTopicToReviewContext)
	if (!context) {
		throw new Error(
			'useAddTopicToReview must be used within an AddTopicToReviewProvider'
		)
	}
	return context
}
