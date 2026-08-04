import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery } from '@convex-dev/react-query'

export const reviewQueries = {
	listByReviewCard: (reviewCardId: Id<'reviewCards'>) =>
		convexQuery(api.reviews.listByReviewCard, { reviewCardId }),
	detail: (reviewId: Id<'reviews'>) =>
		convexQuery(api.reviews.get, { reviewId }),
}
