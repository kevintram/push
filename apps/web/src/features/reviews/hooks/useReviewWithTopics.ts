import { useQuery } from '@tanstack/react-query'
import { getReview } from '../api/getReview'

export function useReviewWithTopics(reviewId: number) {
	const { data: review, isLoading } = useQuery({
		queryKey: ['reviews', reviewId],
		queryFn: () => getReview(reviewId),
		enabled: !!reviewId
	})

	return {
		review,
		isLoading
	}
}
