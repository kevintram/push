import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { DateString } from '~/types/date'
import { todayIso } from '~/utils/date'

import { useDeleteReview, useUpdateReview } from '../api/reviewQueries'
import type { Rating, Review } from '../types/review.types'

type UseReviewActionsReturn = {
	isDeleteDialogOpen: boolean
	isDeleting: boolean
	/**
	 * Note: first rating a review completes it on the user's local today.
	 */
	setRating: (rating: Rating | null) => void
	/**
	 * Note: clearing the date also clears the
	 * rating, since a completed review has to have happened on some day.
	 */
	setDate: (value: DateString | null) => void
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
		(rating: Rating | null) => {
			const date =
				rating === null
					? undefined
					: review.rating === undefined
						? todayIso()
						: review.date
			if (rating !== null && date === undefined) {
				toast.error('Completed review is missing its date')
				return
			}

			updateReview.mutate(
				{
					...(date === undefined ? {} : { date }),
					rating,
					reviewId: review._id,
				},
				{
					onError: () =>
						toast.error('Failed to update review rating'),
				},
			)
		},
		[review._id, review.date, review.rating, updateReview],
	)

	const setDate = useCallback(
		(value: DateString | null) => {
			updateReview.mutate(
				{ date: value, reviewId: review._id },
				{ onError: () => toast.error('Failed to update review date') },
			)
		},
		[review._id, updateReview],
	)

	const confirmDelete = useCallback(() => {
		deleteReview.mutate(
			{ reviewId: review._id },
			{
				onError: () => toast.error('Failed to delete review'),
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
