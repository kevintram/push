import type {
	GetReviewEntriesFilters,
	GetReviewSessionsFilters,
	GetReviewsFilters
} from '../types/api.types'

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
	detail: (reviewId: number) => [...reviewSessionKeys.all, reviewId] as const,
	recent: (limit: number) =>
		[...reviewSessionKeys.all, 'recent', limit] as const
}

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
	detail: (reviewId: number) => [...reviewKeys.all, reviewId] as const
}

export const reviewEntryKeys = {
	all: ['review-entries'] as const,
	lists: () => [...reviewEntryKeys.all, 'list'] as const,
	list: (filters: GetReviewEntriesFilters = {}) => {
		const key: Array<string | number | boolean> = [...reviewEntryKeys.lists()]
		// Stable sort keys to ensure consistent cache keys
		const sortedKeys = Object.keys(filters).sort() as Array<
			keyof GetReviewEntriesFilters
		>

		for (const paramKey of sortedKeys) {
			const value = filters[paramKey]
			if (value !== undefined) {
				key.push(paramKey, String(value))
			}
		}
		return key
	}
}

export const reviewQueueKeys = {
	all: ['review-queue'] as const,
	list: (limit?: number) =>
		limit === undefined
			? [...reviewQueueKeys.all, 'list']
			: [...reviewQueueKeys.all, 'list', limit]
}
