import type { DateString } from '~/types/date'

export type ReviewCard = {
	id: number
	primaryText: string
	secondaryText?: string
}

export type ReviewCardFilters = {
	due: 'late' | 'new' | DateString
}
