import type { Doc } from '@convex/_generated/dataModel'

import type { DateString } from '~/types/date'

export type ReviewCard = Doc<'reviewCards'>

/**
 * Scheduling state is still derived by the FastAPI service from a card's
 * reviews and its FSRS parameters, none of which Convex knows about yet. Card
 * views take it as a separate prop so the metadata they already render can stay
 * in place, reading as "unreviewed", until the scheduler moves over too.
 */
export type ReviewCardSrsState = {
	stability: number | null
	lastReviewedAt: DateString | null
	nextDueAt: DateString | null
	freshnessTier: string | null
}

export const unscheduledSrsState: ReviewCardSrsState = {
	stability: null,
	lastReviewedAt: null,
	nextDueAt: null,
	freshnessTier: null,
}

export type Review = Doc<'reviews'>

export type Rating = Review['rating']

export type ReviewFilters = {
	reviewCardId: string
	order?: 'asc' | 'desc'
}
