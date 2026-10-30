import { useCallback, useState } from 'react'

import { toast } from '~/components/ui/Toast'
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
	 * Note: the date can only be cleared while the review is uncompleted, since
	 * a completed review has to have happened on some day.
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
			// The first completion carries today's date; a re-rating leaves the
			// stored completion day alone.
			const date =
				rating !== null && review.rating === undefined
					? todayIso()
					: undefined

			updateReview.mutate(
				{
					...(date === undefined ? {} : { date }),
					rating,
					reviewId: review._id,
				},
				{
					onError: () =>
						toast.add({
							title: 'Failed to update review rating',
							type: 'error',
						}),
				},
			)
		},
		[review._id, review.rating, updateReview],
	)

	const setDate = useCallback(
		(value: DateString | null) => {
			updateReview.mutate(
				{ date: value, reviewId: review._id },
				{
					onError: () =>
						toast.add({
							title: 'Failed to update review date',
							type: 'error',
						}),
				},
			)
		},
		[review._id, updateReview],
	)

	const confirmDelete = useCallback(() => {
		deleteReview.mutate(
			{ reviewId: review._id },
			{
				onError: () =>
					toast.add({
						title: 'Failed to delete review',
						type: 'error',
					}),
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
