import {
	calculateRetrievability,
	getFreshnessTier,
} from '@convex/model/srs/retrievability'

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
	const retrievability = calculateRetrievability(
		stability,
		lastReviewedAt,
		today,
	)

	return {
		freshnessTier: getFreshnessTier(retrievability),
		lastReviewedAt,
		// Card due-date aggregation is separate from the retrievability model.
		nextDueAt: null,
		stability,
	}
}
