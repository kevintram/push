import { createContext, useCallback, useContext, useMemo } from 'react'
import type { Review, TopicReview } from '../../types/review.types'

interface AddTopicToReviewContextValue {
	// Review
	review: Review | undefined
	isReviewCompleted: boolean

	// Helpers (for any topic, not just selected)
	isTopicAdded: (topicId: number) => boolean
	getTopicReview: (topicId: number) => TopicReview | undefined
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

	const value = useMemo<AddTopicToReviewContextValue>(
		() => ({
			review,
			isReviewCompleted,
			isTopicAdded,
			getTopicReview
		}),
		[review, isReviewCompleted, isTopicAdded, getTopicReview]
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
