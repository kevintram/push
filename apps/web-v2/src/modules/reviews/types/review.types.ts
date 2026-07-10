import type { DateString } from '~/types/date'

export type ReviewCard = {
	id: number
	primary_text: string
	secondary_text?: string
}

export type ReviewCardFilters = {
	due: 'late' | 'new' | DateString
}
