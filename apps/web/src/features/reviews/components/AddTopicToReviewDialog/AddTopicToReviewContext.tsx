import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState
} from 'react'
import { createTopicReview as createTopicReviewApi } from '~/features/reviews/api/createTopicReview'
import { deleteTopicReview } from '~/features/reviews/api/deleteTopicReview'
import { updateTopicReview as updateTopicReviewApi } from '~/features/reviews/api/updateTopicReview'
import { useTopicWithRelationships } from '~/features/topics/hooks/useTopicWithRelationships'
import type {
	Rating,
	Review,
	Topic,
	TopicReview
} from '~/models/review-topic.types'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

interface AddTopicToReviewContextValue {
	// Review
	review: Review | undefined
	isReviewCompleted: boolean

	// Selected topic (single query)
	selectedTopicId: number | undefined
	setSelectedTopicId: (id: number | undefined) => void
	selectedTopic: Topic | undefined
	isLoadingTopic: boolean

	// Derived state for selected topic
	isSelectedTopicAdded: boolean
	selectedTopicReview: TopicReview | undefined

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
	const queryClient = useQueryClient()

	// Selected topic state
	const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(
		undefined
	)

	// Single source of truth for selected topic data
	const { topic: selectedTopic, isLoading: isLoadingTopic } =
		useTopicWithRelationships(selectedTopicId)

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

	// Derived state for selected topic
	const isSelectedTopicAdded = useMemo(
		() => (selectedTopic ? isTopicAdded(selectedTopic.id) : false),
		[selectedTopic, isTopicAdded]
	)

	const selectedTopicReview = useMemo(
		() => (selectedTopic ? getTopicReview(selectedTopic.id) : undefined),
		[selectedTopic, getTopicReview]
	)

	// Mutations
	const {
		mutateAsync: createTopicReviewMutation,
		isPending: isCreatingTopicReview
	} = useMutation({
		mutationFn: createTopicReviewApi,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const { mutateAsync: deleteTopicReviewMutation } = useMutation({
		mutationFn: deleteTopicReview,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const { mutateAsync: updateTopicReviewMutation } = useMutation({
		mutationFn: ({ id, rating }: { id: number; rating: Rating }) =>
			updateTopicReviewApi(id, rating),
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

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

			return await createTopicReviewMutation(payload)
		},
		[review, createTopicReviewMutation, isReviewCompleted]
	)

	const removeTopicReviewById = useCallback(
		async (topicReviewId: number) => {
			await deleteTopicReviewMutation(topicReviewId)
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
			await updateTopicReviewMutation({ id: topicReviewId, rating })
		},
		[updateTopicReviewMutation]
	)

	const value = useMemo<AddTopicToReviewContextValue>(
		() => ({
			review,
			isReviewCompleted,
			selectedTopicId,
			setSelectedTopicId,
			selectedTopic,
			isLoadingTopic,
			isSelectedTopicAdded,
			selectedTopicReview,
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
			selectedTopicId,
			selectedTopic,
			isLoadingTopic,
			isSelectedTopicAdded,
			selectedTopicReview,
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
