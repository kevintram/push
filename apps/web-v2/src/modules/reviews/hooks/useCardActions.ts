import { DateTime } from 'luxon'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useDeleteCard, useUpdateCard } from '../api/cardQueries'
import type { Card } from '../types/review.types'

type UseCardActionsReturn = {
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
 * The mutations behind a card's action menu. Shared so the list card and
 * the card detail page cannot drift apart on what those actions do.
 */
export function useCardActions(card: Card): UseCardActionsReturn {
	const updateCard = useUpdateCard()
	const deleteCard = useDeleteCard()

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const toggleType = useCallback(() => {
		updateCard.mutate(
			{
				cardId: card._id,
				type: card.type === 'flashcard' ? 'practice' : 'flashcard',
			},
			{ onError: () => toast.error('Failed to update card type') },
		)
	}, [card._id, card.type, updateCard])

	const toggleFlag = useCallback(() => {
		updateCard.mutate(
			{
				cardId: card._id,
				// `null` unsets the field; see `cards.update`.
				flaggedAt:
					card.flaggedAt === undefined
						? DateTime.now().toMillis()
						: null,
			},
			{ onError: () => toast.error('Failed to update card flag') },
		)
	}, [card._id, card.flaggedAt, updateCard])

	const confirmDelete = useCallback(() => {
		deleteCard.mutate(
			{ cardId: card._id },
			{
				onError: () => toast.error('Failed to delete card'),
				// Leave the dialog open on failure so the toast has context.
				onSuccess: () => setIsDeleteDialogOpen(false),
			},
		)
	}, [deleteCard, card._id])

	return {
		confirmDelete,
		isDeleteDialogOpen,
		isDeleting: deleteCard.isPending,
		setIsDeleteDialogOpen,
		toggleFlag,
		toggleType,
	}
}
