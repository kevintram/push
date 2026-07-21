import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewCardSchema } from '../types/review.schemas'
import type { ReviewCard, ReviewCardFilters } from '../types/review.types'

export async function fetchReviewCards(
	filters?: ReviewCardFilters,
): Promise<Array<ReviewCard>> {
	return apiFetch(v.array(ReviewCardSchema), '/review-cards/', {
		params: {
			due: filters?.due,
			topic_id: filters?.topicId,
		},
	})
}

export async function fetchReviewCard(
	reviewCardId: string,
): Promise<ReviewCard> {
	return apiFetch(ReviewCardSchema, `/review-cards/${reviewCardId}/`)
}
