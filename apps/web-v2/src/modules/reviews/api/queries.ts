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
	detail: (reviewCardId: number | string) => {
		const normalizedReviewCardId = String(reviewCardId)
		return queryOptions({
			queryKey: [
				...reviewCardQueries.all,
				'detail',
				normalizedReviewCardId,
			],
			queryFn: () => fetchReviewCard(normalizedReviewCardId),
		})
	},
}

export const reviewQueries = {
	all: ['reviews'] as const,
	list: (filters: ReviewFilters) => {
		const normalizedFilters = {
			...filters,
			reviewCardId: String(filters.reviewCardId),
		}
		return queryOptions({
			queryKey: [...reviewQueries.all, 'list', normalizedFilters],
			queryFn: () => fetchReviews(normalizedFilters),
		})
	},
}
