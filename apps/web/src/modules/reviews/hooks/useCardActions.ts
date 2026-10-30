import { DateTime } from 'luxon'
import { useCallback, useState } from 'react'

import { toast } from '~/components/ui/Toast'

import { useDeleteCard, useUpdateCard } from '../api/cardQueries'
import type { Card } from '../types/review.types'

type UseCardActionsReturn = {
	isDeleteDialogOpen: boolean
	isDeleting: boolean
	/** Swaps the card between `flashcard` and `practice`. */
	toggleType: () => void
	/** Flags an unflagged card, or clears the flag on a flagged one. */
	toggleFlag: () => void
	/**
	 * Retires an active card, or brings a retired one back. A retired card
	 * drops out of every review queue; see `due.list`.
	 */
	toggleRetire: () => void
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
			{
				onError: () =>
					toast.add({
						title: 'Failed to update card type',
						type: 'error',
					}),
			},
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
			{
				onError: () =>
					toast.add({
						title: 'Failed to update card flag',
						type: 'error',
					}),
			},
		)
	}, [card._id, card.flaggedAt, updateCard])

	const toggleRetire = useCallback(() => {
		updateCard.mutate(
			{
				cardId: card._id,
				// `null` unsets the field; see `cards.update`.
				retiredAt:
					card.retiredAt === undefined
						? DateTime.now().toMillis()
						: null,
			},
			{
				onError: () =>
					toast.add({
						title: 'Failed to update card retirement',
						type: 'error',
					}),
			},
		)
	}, [card._id, card.retiredAt, updateCard])

	const confirmDelete = useCallback(() => {
		deleteCard.mutate(
			{ cardId: card._id },
			{
				onError: () =>
					toast.add({
						title: 'Failed to delete card',
						type: 'error',
					}),
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
		toggleRetire,
		toggleType,
	}
}
