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

/** Format FSRS stability in whole days, or `null` when unavailable. */
export function formatDurability(stability: number | null): string | null {
	if (stability === null) return null
	return `${Math.round(stability)}d`
}

/** Explain the minimum memory duration represented by an FSRS stability value. */
export function formatDurabilityTooltip(
	stability: number | null,
): string | null {
	const durability = formatDurability(stability)
	if (durability === null) return null
	return `Estimated to remember for at least ${durability}`
}
