import type { ReviewCardFilters } from '../types/review.types'

export const reviewCardKeys = {
	all: ['review-cards'] as const,
	list: (filters?: ReviewCardFilters) =>
		[...reviewCardKeys.all, 'list', filters] as const,
}
