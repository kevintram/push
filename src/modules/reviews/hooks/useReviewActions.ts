import { useCallback, useState } from 'react'

import type { DateString } from '~/types/date'

import { useDeleteReview, useUpdateReview } from '../api/reviewQueries'
import type { Rating, Review } from '../types/review.types'

type UseReviewActionsReturn = {
	isDeleteDialogOpen: boolean
	isDeleting: boolean
	/** Re-rates the review, keeping its completion day. */
	setRating: (rating: Rating) => void
	/** Moves the review to another completion day. */
	setDate: (value: DateString) => void
	setIsDeleteDialogOpen: (open: boolean) => void
	confirmDelete: () => void
}

/**
 * The mutations behind a review's action menu. Shared so any future list of
 * reviews and the review's own controls cannot drift apart on what those
 * actions do.
 */
export function useReviewActions(review: Review): UseReviewActionsReturn {
	const updateReview = useUpdateReview()
	const deleteReview = useDeleteReview()

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const setRating = useCallback(
		(rating: Rating) => {
			updateReview.mutate({ rating, reviewId: review._id })
		},
		[review._id, updateReview],
	)

	const setDate = useCallback(
		(value: DateString) => {
			updateReview.mutate({ date: value, reviewId: review._id })
		},
		[review._id, updateReview],
	)

	const confirmDelete = useCallback(() => {
		deleteReview.mutate(
			{ reviewId: review._id },
			{
				// Leave the dialog open on failure so the toast has context.
				onSuccess: () => setIsDeleteDialogOpen(false),
			},
		)
	}, [deleteReview, review._id])

	return {
		confirmDelete,
		isDeleteDialogOpen,
		isDeleting: deleteReview.isPending,
		setDate,
		setIsDeleteDialogOpen,
		setRating,
	}
}
