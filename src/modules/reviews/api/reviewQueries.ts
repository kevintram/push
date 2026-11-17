import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { ReviewCreate } from '@convex/validators/reviews'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { createElement } from 'react'

import {
	toastDeleted,
	toastError,
	toastName,
	toastTitle,
	toastUndo,
} from '~/components/ui/Toast'

import { ratings } from '../components/reviewRatings'
import { ReviewToastDescription } from '../components/ReviewToastDescription'

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
		onSuccess: ({ review, card }, created) => {
			const undo = async () => {
				await remove({ reviewId: review._id })
				onUndone?.(created)
			}
			const { Icon, label } = ratings[created.rating]
			toastUndo({
				icon: Icon,
				title: toastTitle(label, ' on ', toastName(card.prompt)),
				description: createElement(ReviewToastDescription, {
					review,
					card,
				}),
				undo,
			})
		},
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
		onSuccess: review =>
			toastDeleted(
				review.description.trim()
					? toastName(review.description)
					: 'review',
			),
	})
}
