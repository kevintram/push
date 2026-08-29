import { calculateRetrievability } from '@shared/srs/retrievability'

import type { DateString } from '~/types/date'

import type { Card, CardSrsState } from '../types/review.types'

/** Build the time-sensitive SRS metadata used by card views. */
export function deriveCardSrsState(
	card: Card,
	today: DateString,
): CardSrsState {
	const stability = card.stability ?? null
	const lastReviewedAt =
		(card.lastReview?.date as DateString | undefined) ?? null
	const lastRating = card.lastReview?.rating ?? null
	const nextDueAt = (card.dueDate as DateString | undefined) ?? null
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

/** Format an FSRS recall estimate for display, or `null` when unavailable. */
export function formatRecall(retrievability: number | null): string | null {
	if (retrievability === null) return null
	return `${Math.round(retrievability * 100)}%`
}

/** Format FSRS stability in whole days, or `null` when unavailable. */
export function formatDurability(stability: number | null): string | null {
	if (stability === null) return null
	return `${Math.round(stability)}d`
}
