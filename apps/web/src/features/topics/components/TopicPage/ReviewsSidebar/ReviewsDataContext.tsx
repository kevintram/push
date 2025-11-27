import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { type Review as ApiReview, getReviews } from '~/features/reviews/api'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

// Context interface
export interface ReviewsContextValue {
	// Data
	scheduledReviews: Array<ApiReview>
	unscheduledReviews: Array<ApiReview>

	// Loading states
	isLoadingReviews: boolean

	// Utilities
	revalidateReviews: () => void
}

export const ReviewsDataContext = createContext<ReviewsContextValue | null>(
	null
)

interface ReviewsDataProviderProps {
	children: React.ReactNode
	selectedTopicId: number | undefined
}

export function ReviewsDataProvider({
	children,
	selectedTopicId
}: ReviewsDataProviderProps) {
	const queryClient = useQueryClient()

	// Fetch all reviews for the selected topic
	const {
		data: rawAllReviews = [],
		isLoading: isLoadingReviews,
		refetch: refetchReviews
	} = useQuery({
		queryKey: ['reviews', { topicId: selectedTopicId }],
		queryFn: () => getReviews({ topicId: selectedTopicId }),
		enabled: !!selectedTopicId
	})

	// Split into scheduled/unscheduled
	const { scheduledReviews, unscheduledReviews } = useMemo(() => {
		// Split into scheduled (has effective_date) and unscheduled (no effective_date)
		const scheduled = rawAllReviews
			.filter(review => review.effective_date != null)
			.sort(
				(a, b) =>
					new Date(a.effective_date!).getTime() -
					new Date(b.effective_date!).getTime()
			)

		const unscheduled = rawAllReviews
			.filter(review => review.effective_date == null)
			.sort(
				(a, b) =>
					new Date(b.inserted_at!).getTime() -
					new Date(a.inserted_at!).getTime()
			)

		return { scheduledReviews: scheduled, unscheduledReviews: unscheduled }
	}, [rawAllReviews])

	const revalidateReviews = useCallback(() => {
		refetchReviews()
		invalidateTopicsAndReviews(queryClient)
	}, [refetchReviews, queryClient])

	const contextValue: ReviewsContextValue = {
		scheduledReviews,
		unscheduledReviews,
		isLoadingReviews,
		revalidateReviews
	}

	return (
		<ReviewsDataContext value={contextValue}>{children}</ReviewsDataContext>
	)
}

export function useReviewsData() {
	const context = useContext(ReviewsDataContext)
	if (!context) {
		throw new Error('useReviewsData must be used within ReviewsDataProvider')
	}
	return context
}
