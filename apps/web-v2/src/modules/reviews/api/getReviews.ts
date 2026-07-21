import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewSchema } from '../types/review.schemas'
import type { Review, ReviewFilters } from '../types/review.types'

export async function fetchReviews({
	reviewCardId,
	order = 'desc',
}: ReviewFilters): Promise<Array<Review>> {
	return apiFetch(v.array(ReviewSchema), '/reviews/', {
		params: { review_card_id: reviewCardId, order },
	})
}
