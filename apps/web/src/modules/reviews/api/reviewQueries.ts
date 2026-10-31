import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { ReviewCreate } from '@convex/validators/reviews'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

import { toastError, toastUndo } from '~/components/ui/Toast'

export const reviewQueries = {
	listByCard: (cardId: Id<'cards'>) =>
		convexQuery(api.reviews.listByCard, { cardId }),
	detail: (reviewId: Id<'reviews'>) =>
		convexQuery(api.reviews.get, { reviewId }),
}

type UseCreateReviewOptions = {
	/** Called with the review once undoing it has deleted it. */
	onUndone?: (review: ReviewCreate) => void
}

/** Creates a review, offering to undo it, which restores the card's schedule. */
export function useCreateReview({ onUndone }: UseCreateReviewOptions = {}) {
	const mutationFn = useConvexMutation(api.reviews.create)
	const remove = useConvexMutation(api.reviews.remove)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to create review', error),
		onSuccess: (reviewId, review) =>
			toastUndo({
				title: 'Review added',
				undo: async () => {
					await remove({ reviewId })
					onUndone?.(review)
				},
			}),
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
