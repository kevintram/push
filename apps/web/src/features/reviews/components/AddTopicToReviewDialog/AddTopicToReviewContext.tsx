import { createContext, useCallback, useContext, useMemo } from 'react'
import type { Review, ReviewSession } from '../../types/review.types'

interface AddTopicToReviewContextValue {
	// ReviewSession
	review: ReviewSession | undefined
	isReviewCompleted: boolean

	// Helpers (for any topic, not just selected)
	isTopicAdded: (topicId: number) => boolean
	getReview: (topicId: number) => Review | undefined
}

const AddTopicToReviewContext =
	createContext<AddTopicToReviewContextValue | null>(null)

interface AddTopicToReviewProviderProps {
	review: ReviewSession | undefined
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
		() => new Set(review?.reviews?.map(tr => tr.topic_id) ?? []),
		[review?.reviews]
	)

	// Helper functions
	const isTopicAdded = useCallback(
		(topicId: number) => addedTopics.has(topicId),
		[addedTopics]
	)

	const getReview = useCallback(
		(topicId: number) => {
			return review?.reviews?.find(tr => tr.topic_id === topicId)
		},
		[review?.reviews]
	)

	const value = useMemo<AddTopicToReviewContextValue>(
		() => ({
			review,
			isReviewCompleted,
			isTopicAdded,
			getReview
		}),
		[review, isReviewCompleted, isTopicAdded, getReview]
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
