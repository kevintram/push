import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

import { toastError } from '~/components/ui/Toast'

export const reviewQueries = {
	listByCard: (cardId: Id<'cards'>) =>
		convexQuery(api.reviews.listByCard, { cardId }),
	detail: (reviewId: Id<'reviews'>) =>
		convexQuery(api.reviews.get, { reviewId }),
}

export function useCreateReview() {
	const mutationFn = useConvexMutation(api.reviews.create)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to create review', error),
	})
}

export function useUpdateReview() {
	const mutationFn = useConvexMutation(api.reviews.update)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to update review', error),
	})
}

export function useDeleteReview() {
	const mutationFn = useConvexMutation(api.reviews.remove)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to delete review', error),
	})
}
