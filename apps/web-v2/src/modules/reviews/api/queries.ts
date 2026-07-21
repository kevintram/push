import { queryOptions } from '@tanstack/react-query'

import type { ReviewCardFilters, ReviewFilters } from '../types/review.types'
import { fetchReviewCard, fetchReviewCards } from './getReviewCards'
import { fetchReviews } from './getReviews'

export const reviewCardQueries = {
	all: ['review-cards'] as const,
	lists: () => [...reviewCardQueries.all, 'list'] as const,
	list: (filters?: ReviewCardFilters) => {
		const normalizedFilters =
			filters === undefined
				? undefined
				: {
						...filters,
						topicId:
							filters.topicId === undefined
								? undefined
								: String(filters.topicId),
					}
		return queryOptions({
			queryKey: [...reviewCardQueries.lists(), normalizedFilters],
			queryFn: () => fetchReviewCards(normalizedFilters),
		})
	},
	detail: (reviewCardId: string) => {
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
	lists: () => [...reviewQueries.all, 'list'] as const,
	forCard: (reviewCardId: string) =>
		[
			...reviewQueries.lists(),
			{ reviewCardId: String(reviewCardId) },
		] as const,
	list: (filters: ReviewFilters) => {
		const normalizedFilters: ReviewFilters = {
			...filters,
			reviewCardId: String(filters.reviewCardId),
			order: filters.order ?? 'desc',
		}
		return queryOptions({
			queryKey: [...reviewQueries.lists(), normalizedFilters],
			queryFn: () => fetchReviews(normalizedFilters),
		})
	},
}
