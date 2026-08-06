import type { Doc } from '@convex/_generated/dataModel'
import type { FreshnessTier } from '@convex/model/srs/retrievability'

import type { DateString } from '~/types/date'

export type ReviewCard = Doc<'reviewCards'>

/** Client-derived scheduling metadata displayed alongside a review card. */
export type ReviewCardSrsState = {
	stability: number | null
	lastReviewedAt: DateString | null
	nextDueAt: DateString | null
	freshnessTier: FreshnessTier | null
}

export type Review = Doc<'reviews'>

export type Rating = NonNullable<Review['rating']>

export type ReviewFilters = {
	reviewCardId: string
	order?: 'asc' | 'desc'
}
