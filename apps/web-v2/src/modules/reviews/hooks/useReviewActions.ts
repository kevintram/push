import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { DateString } from '~/types/date'

import { useDeleteReview, useUpdateReview } from '../api/reviewQueries'
import type { Rating, Review } from '../types/review.types'

type UseReviewActionsReturn = {
	isDeleteDialogOpen: boolean
	isDeleting: boolean
	/**
	 * Sets the review's rating. A rating completes the review; `null` clears
	 * both rating and completion. The backend derives `completedAt`.
	 */
	setRating: (rating: Rating | null) => void
	/**
	 * Sets the review's date. Edits `completedAt` for an already-completed
	 * review, otherwise `scheduledAt`. Clearing a completed review's date also
	 * clears its rating, which the backend enforces.
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
			updateReview.mutate(
				{ rating, reviewId: review._id },
				{
					onError: () =>
						toast.error('Failed to update review rating'),
				},
			)
		},
		[review._id, updateReview],
	)

	const setDate = useCallback(
		(value: DateString | null) => {
			const isCompleted = review.completedAt !== undefined
			updateReview.mutate(
				{
					reviewId: review._id,
					...(isCompleted
						? { completedAt: value }
						: { scheduledAt: value }),
				},
				{ onError: () => toast.error('Failed to update review date') },
			)
		},
		[review._id, review.completedAt, updateReview],
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
