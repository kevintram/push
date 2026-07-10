import { queryOptions } from '@tanstack/react-query'

import type { ReviewCardFilters } from '../types/review.types'
import { fetchReviewCards } from './getReviewCards'

export const reviewCardQueries = {
	all: ['review-cards'] as const,
	list: (filters?: ReviewCardFilters) =>
		queryOptions({
			queryKey: [...reviewCardQueries.all, 'list', filters],
			queryFn: () => fetchReviewCards(filters),
		}),
}
