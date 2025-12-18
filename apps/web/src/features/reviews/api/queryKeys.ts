import type { GetReviewSessionsFilters } from '../types/api.types'

export const reviewSessionKeys = {
	all: ['review-sessions'] as const,
	lists: () => [...reviewSessionKeys.all, 'list'] as const,
	list: (filters: GetReviewSessionsFilters = {}) => {
		const key: Array<string | number | boolean> = [...reviewSessionKeys.lists()]
		// Stable sort keys to ensure consistent cache keys
		const sortedKeys = Object.keys(filters).sort() as Array<
			keyof GetReviewSessionsFilters
		>

		for (const paramKey of sortedKeys) {
			const value = filters[paramKey]
			if (value !== undefined) {
				key.push(paramKey, String(value))
			}
		}
		return key
	},
	detail: (reviewId: number) => [...reviewSessionKeys.all, reviewId] as const
}

export const reviewKeys = {
	all: ['reviews'] as const
}
