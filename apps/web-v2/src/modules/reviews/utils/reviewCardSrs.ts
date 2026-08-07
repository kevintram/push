import { calculateRetrievability } from '@shared/srs/retrievability'

import type { DateString } from '~/types/date'

import type { ReviewCard, ReviewCardSrsState } from '../types/review.types'

/** Build the time-sensitive SRS metadata used by card views. */
export function deriveReviewCardSrsState(
	reviewCard: ReviewCard,
	today: DateString,
): ReviewCardSrsState {
	const stability = reviewCard.stability ?? null
	const lastReviewedAt =
		(reviewCard.lastReviewedAt as DateString | undefined) ?? null
	return {
		lastReviewedAt,
		// Card due-date aggregation is separate from the retrievability model.
		nextDueAt: null,
		retrievability: calculateRetrievability(
			stability,
			lastReviewedAt,
			today,
		),
		stability,
	}
}
