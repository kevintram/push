import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState
} from 'react'
import type { Review } from '~/features/reviews/api'
import {
	createTopicReview,
	deleteTopicReview
} from '~/features/topic_reviews/api'
import { updateTopicReview as updateTopicReviewApi } from '~/features/topic_reviews/api/updateTopicReview'
import { useTopicWithRelationships } from '~/features/topics/hooks/useTopicWithRelationships'
import type { Rating, Topic, TopicReview } from '~/models/review-topic.types'
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
	addTopicToReview: (topic: Topic) => Promise<void>
	removeTopicFromReview: (topic: Topic) => Promise<void>
	removeTopicReviewById: (topicReviewId: number) => Promise<void>
	updateRating: (topicReviewId: number, rating: Rating) => Promise<void>
	createTopicAndAddToReview: (topicData: {
		name: string
		notes: string
		archived: boolean
		inboxed: boolean
	}) => Promise<TopicReview>

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
		mutationFn: createTopicReview,
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
		async (topic: Topic) => {
			if (!review) return

			try {
				await createTopicReviewMutation({
					review_id: review.id,
					topic_id: topic.id,
					rating: isReviewCompleted ? 'good' : null
				})
			} catch {
				// Handle error silently for now
			}
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

	const createTopicAndAddToReview = useCallback(
		async (topicData: {
			name: string
			notes: string
			archived: boolean
			inboxed: boolean
		}) => {
			if (!review) throw new Error('Review is required')

			return await createTopicReviewMutation({
				review_id: review.id,
				topic: topicData,
				rating: isReviewCompleted ? 'good' : null
			})
		},
		[review, createTopicReviewMutation, isReviewCompleted]
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
			createTopicAndAddToReview,
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
			createTopicAndAddToReview,
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
