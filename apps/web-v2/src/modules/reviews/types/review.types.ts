import type { Doc } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'

import type { DateString } from '~/types/date'

export type { Card }

/** Client-derived scheduling metadata displayed alongside a card. */
export type CardSrsState = {
	stability: number | null
	lastReviewedAt: DateString | null
	lastRating: Rating | null
	nextDueAt: DateString | null
	/** Recall probability today, between zero and one. */
	retrievability: number | null
}

export type Review = Doc<'reviews'>

export type Rating = NonNullable<Review['rating']>

export type ReviewFilters = {
	cardId: string
	order?: 'asc' | 'desc'
}
