import { DateTime } from 'luxon'
import { useCallback } from 'react'

import { useDeleteCards, useUpdateCards } from '../api/cardQueries'
import type { Card } from '../types/review.types'

const idsOf = (cards: ReadonlyArray<Card>) => cards.map(card => card._id)

type UseCardActionsReturn = {
	isDeleting: boolean
	/** Makes every card a flashcard, or practice cards when all already are. */
	toggleType: (cards: ReadonlyArray<Card>) => void
	/** Flags every card, or clears the flags when all are already flagged. */
	toggleFlag: (cards: ReadonlyArray<Card>) => void
	/**
	 * Retires every card, or brings them back when all are already retired. A
	 * retired card drops out of every review queue; see `due.list`.
	 */
	toggleRetire: (cards: ReadonlyArray<Card>) => void
	remove: (cards: ReadonlyArray<Card>, onSuccess: () => void) => void
}

/**
 * The mutations behind a card's action menu, for one card or several. Shared
 * so the list card and the card detail page cannot drift apart on what those
 * actions do.
 */
export function useCardActions(): UseCardActionsReturn {
	const updateCards = useUpdateCards()
	const deleteCards = useDeleteCards()

	const toggleType = useCallback(
		(cards: ReadonlyArray<Card>) => {
			updateCards.mutate({
				cardIds: idsOf(cards),
				type: cards.every(card => card.type === 'flashcard')
					? 'practice'
					: 'flashcard',
			})
		},
		[updateCards],
	)

	const toggleFlag = useCallback(
		(cards: ReadonlyArray<Card>) => {
			const unflagged = cards.filter(card => card.flaggedAt === undefined)
			updateCards.mutate(
				// Only the unflagged cards get a flag, so the others keep the
				// time they were flagged, which orders the flagged list.
				unflagged.length > 0
					? {
							cardIds: idsOf(unflagged),
							flaggedAt: DateTime.now().toMillis(),
						}
					: // `null` unsets the field; see `cards.update`.
						{ cardIds: idsOf(cards), flaggedAt: null },
			)
		},
		[updateCards],
	)

	const toggleRetire = useCallback(
		(cards: ReadonlyArray<Card>) => {
			const active = cards.filter(card => card.retiredAt === undefined)
			updateCards.mutate(
				// Same as `toggleFlag`: retired cards keep their retirement time.
				active.length > 0
					? {
							cardIds: idsOf(active),
							retiredAt: DateTime.now().toMillis(),
						}
					: { cardIds: idsOf(cards), retiredAt: null },
			)
		},
		[updateCards],
	)

	const remove = useCallback(
		(cards: ReadonlyArray<Card>, onSuccess: () => void) => {
			deleteCards.mutate({ cardIds: idsOf(cards) }, { onSuccess })
		},
		[deleteCards],
	)

	return {
		isDeleting: deleteCards.isPending,
		remove,
		toggleFlag,
		toggleRetire,
		toggleType,
	}
}
