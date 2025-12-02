import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createContext, useContext, useMemo } from 'react'
import { getReviews } from '~/features/reviews/api/getReviews'
import type { Review } from '~/models/review-topic.types'

interface ReviewsDataContextValue {
	scheduledReviews: Array<Review>
	unscheduledReviews: Array<Review>
	isLoading: boolean
}

const ReviewsDataContext = createContext<ReviewsDataContextValue | null>(null)

export function useReviewsData() {
	const context = useContext(ReviewsDataContext)
	if (!context) {
		throw new Error('useReviewsData must be used within a ReviewsDataProvider')
	}
	return context
}

interface ReviewsDataProviderProps {
	children: ReactNode
	selectedTopicId: number | undefined
}

export function ReviewsDataProvider({
	children,
	selectedTopicId
}: ReviewsDataProviderProps) {
	const { data: reviews = [], isLoading } = useQuery({
		queryKey: ['reviews', selectedTopicId],
		queryFn: () => getReviews({ topicId: selectedTopicId }),
		enabled: selectedTopicId !== undefined
	})

	const { scheduledReviews, unscheduledReviews } = useMemo(() => {
		const scheduled: Array<Review> = []
		const unscheduled: Array<Review> = []

		for (const review of reviews) {
			if (review.scheduled_at) {
				scheduled.push(review)
			} else {
				unscheduled.push(review)
			}
		}

		// Sort scheduled by date asc
		scheduled.sort((a, b) => {
			return (
				new Date(a.scheduled_at!).getTime() -
				new Date(b.scheduled_at!).getTime()
			)
		})

		// Sort unscheduled by inserted_at desc (newest first)
		unscheduled.sort((a, b) => {
			return (
				new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
			)
		})

		return {
			scheduledReviews: scheduled,
			unscheduledReviews: unscheduled
		}
	}, [reviews])

	const value = useMemo(
		() => ({
			scheduledReviews,
			unscheduledReviews,
			isLoading
		}),
		[scheduledReviews, unscheduledReviews, isLoading]
	)

	return (
		<ReviewsDataContext.Provider value={value}>
			{children}
		</ReviewsDataContext.Provider>
	)
}
