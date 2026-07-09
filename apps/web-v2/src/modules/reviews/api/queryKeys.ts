import type { DateString } from '~/types/date'

type ReviewCardFilters = {
	due: 'late' | 'new' | DateString
}

export const reviewCardKeys = {
	all: ['review-cards'] as const,
	list: (filters?: ReviewCardFilters) =>
		[...reviewCardKeys.all, 'list', filters] as const,
}
