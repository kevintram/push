import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

export const reviewQueries = {
	listByCard: (cardId: Id<'cards'>) =>
		convexQuery(api.reviews.listByCard, { cardId }),
	detail: (reviewId: Id<'reviews'>) =>
		convexQuery(api.reviews.get, { reviewId }),
}

export function useCreateReview() {
	const mutationFn = useConvexMutation(api.reviews.create)
	return useMutation({ mutationFn })
}

export function useUpdateReview() {
	const mutationFn = useConvexMutation(api.reviews.update)
	return useMutation({ mutationFn })
}

export function useDeleteReview() {
	const mutationFn = useConvexMutation(api.reviews.remove)
	return useMutation({ mutationFn })
}
