import type { Doc } from '@convex/_generated/dataModel'
import type { ReviewCard } from '@convex/validators/reviewCards'

import type { DateString } from '~/types/date'

export type { ReviewCard }

/** Client-derived scheduling metadata displayed alongside a review card. */
export type ReviewCardSrsState = {
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
	reviewCardId: string
	order?: 'asc' | 'desc'
}
