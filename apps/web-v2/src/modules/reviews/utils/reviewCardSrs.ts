import { calculateRetrievability } from '@shared/srs/retrievability'

import type { DateString } from '~/types/date'

import type { ReviewCard, ReviewCardSrsState } from '../types/review.types'

export type FreshnessTier = 'Fresh' | 'Fine' | 'Hazy' | 'Forgotten'

/** Map an FSRS recall estimate to the product's qualitative freshness tiers. */
export function getFreshnessTier(
	retrievability: number | null,
): FreshnessTier | null {
	if (retrievability === null) return null
	if (retrievability <= 0.75) return 'Forgotten'
	if (retrievability <= 0.85) return 'Hazy'
	if (retrievability <= 0.95) return 'Fine'
	return 'Fresh'
}

/** Build the time-sensitive SRS metadata used by card views. */
export function deriveReviewCardSrsState(
	reviewCard: ReviewCard,
	today: DateString,
): ReviewCardSrsState {
	const stability = reviewCard.stability ?? null
	const lastReviewedAt =
		(reviewCard.lastReview?.date as DateString | undefined) ?? null
	const lastRating = reviewCard.lastReview?.rating ?? null
	const nextDueAt = (reviewCard.dueDate as DateString | undefined) ?? null
	return {
		lastReviewedAt,
		lastRating,
		nextDueAt,
		retrievability: calculateRetrievability(
			stability,
			lastReviewedAt,
			today,
		),
		stability,
	}
}
