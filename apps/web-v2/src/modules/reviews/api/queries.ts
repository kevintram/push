import { queryOptions } from '@tanstack/react-query'

import type { ReviewCardFilters, ReviewFilters } from '../types/review.types'
import { fetchReviewCard, fetchReviewCards } from './getReviewCards'
import { fetchReviews } from './getReviews'

export const reviewCardQueries = {
	all: ['review-cards'] as const,
	list: (filters?: ReviewCardFilters) =>
		queryOptions({
			queryKey: [...reviewCardQueries.all, 'list', filters],
			queryFn: () => fetchReviewCards(filters),
		}),
	detail: (reviewCardId: number | string) =>
		queryOptions({
			queryKey: [...reviewCardQueries.all, 'detail', reviewCardId],
			queryFn: () => fetchReviewCard(reviewCardId),
		}),
}

export const reviewQueries = {
	all: ['reviews'] as const,
	list: (filters: ReviewFilters) =>
		queryOptions({
			queryKey: [...reviewQueries.all, 'list', filters],
			queryFn: () => fetchReviews(filters),
		}),
}
