import { createReview } from '~/modules/reviews/api/createReview'
import { type Review } from '~/modules/reviews/types/review.types'

import { type CreateReviewCardReviewPayload } from '../types/review-card.types'

export function createReviewCardReview(
	reviewCardId: number,
	payload: CreateReviewCardReviewPayload,
): Promise<Review> {
	return createReview({
		review_card_id: reviewCardId,
		...payload,
	})
}
