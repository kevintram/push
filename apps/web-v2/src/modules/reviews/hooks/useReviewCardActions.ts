import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import {
	useDeleteReviewCard,
	useUpdateReviewCard,
} from '../api/reviewCardQueries'
import type { ReviewCard } from '../types/review.types'

type UseReviewCardActionsReturn = {
	isDeleteDialogOpen: boolean
	isDeleting: boolean
	/** Swaps the card between `flashcard` and `practice`. */
	toggleType: () => void
	/** Flags an unflagged card, or clears the flag on a flagged one. */
	toggleFlag: () => void
	setIsDeleteDialogOpen: (open: boolean) => void
	confirmDelete: () => void
}

/**
 * The mutations behind a review card's action menu. Shared so the list card and
 * the card detail page cannot drift apart on what those actions do.
 */
export function useReviewCardActions(
	reviewCard: ReviewCard,
): UseReviewCardActionsReturn {
	const updateReviewCard = useUpdateReviewCard()
	const deleteReviewCard = useDeleteReviewCard()

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const toggleType = useCallback(() => {
		updateReviewCard.mutate(
			{
				reviewCardId: reviewCard._id,
				type:
					reviewCard.type === 'flashcard' ? 'practice' : 'flashcard',
			},
			{ onError: () => toast.error('Failed to update review card type') },
		)
	}, [reviewCard._id, reviewCard.type, updateReviewCard])

	const toggleFlag = useCallback(() => {
		updateReviewCard.mutate(
			{
				reviewCardId: reviewCard._id,
				// `null` unsets the field; see `reviewCards.update`.
				flaggedAt:
					reviewCard.flaggedAt === undefined ? Date.now() : null,
			},
			{ onError: () => toast.error('Failed to update review card flag') },
		)
	}, [reviewCard._id, reviewCard.flaggedAt, updateReviewCard])

	const confirmDelete = useCallback(() => {
		deleteReviewCard.mutate(
			{ reviewCardId: reviewCard._id },
			{
				onError: () => toast.error('Failed to delete review card'),
				// Leave the dialog open on failure so the toast has context.
				onSuccess: () => setIsDeleteDialogOpen(false),
			},
		)
	}, [deleteReviewCard, reviewCard._id])

	return {
		confirmDelete,
		isDeleteDialogOpen,
		isDeleting: deleteReviewCard.isPending,
		setIsDeleteDialogOpen,
		toggleFlag,
		toggleType,
	}
}
