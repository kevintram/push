import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

export const reviewQueries = {
	listByReviewCard: (reviewCardId: Id<'reviewCards'>) =>
		convexQuery(api.reviews.listByReviewCard, { reviewCardId }),
	detail: (reviewId: Id<'reviews'>) =>
		convexQuery(api.reviews.get, { reviewId }),
}

export function useCreateReview() {
	const mutationFn = useConvexMutation(api.reviews.create)
	return useMutation({ mutationFn })
}
