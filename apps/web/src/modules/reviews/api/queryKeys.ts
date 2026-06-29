import { type GetReviewsFilters } from '../types/api.types'

export const reviewKeys = {
	all: ['reviews'] as const,
	lists: () => [...reviewKeys.all, 'list'] as const,
	list: (filters: GetReviewsFilters = {}) => {
		const key: Array<string | number | boolean> = [...reviewKeys.lists()]
		// Stable sort keys to ensure consistent cache keys
		const sortedKeys = Object.keys(filters).sort() as Array<
			keyof GetReviewsFilters
		>

		for (const paramKey of sortedKeys) {
			const value = filters[paramKey]
			if (value !== undefined) {
				key.push(paramKey, String(value))
			}
		}
		return key
	},
	detail: (reviewId: number) => [...reviewKeys.all, reviewId] as const,
}

export const reviewQueueKeys = {
	all: ['review-queue'] as const,
	list: () => [...reviewQueueKeys.all, 'list'] as const,
}
