import { DateTime } from 'luxon'
import { useCallback } from 'react'

import { pluralize } from '~/utils/pluralize'

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
 *
 * Retiring, and anything done to several cards at once, offers an undo: a
 * retired card vanishes from the review queues, and a bulk change is easy to
 * make by mistake. A change to one card shows on that card.
 */
export function useCardActions(): UseCardActionsReturn {
	const updateCards = useUpdateCards()
	const deleteCards = useDeleteCards()

	const toggleType = useCallback(
		(cards: ReadonlyArray<Card>) => {
			const type = cards.every(card => card.type === 'flashcard')
				? 'practice'
				: 'flashcard'
			updateCards.mutate({
				cardIds: idsOf(cards),
				type,
				...(cards.length > 1 && {
					undo: {
						title: `Made ${pluralize(cards.length, 'card')} ${type === 'flashcard' ? 'flashcards' : 'practice cards'}`,
						cards,
					},
				}),
			})
		},
		[updateCards],
	)

	const toggleFlag = useCallback(
		(cards: ReadonlyArray<Card>) => {
			const unflagged = cards.filter(card => card.flaggedAt === undefined)
			// Only the unflagged cards get a flag, so the others keep the time
			// they were flagged, which orders the flagged list.
			const flagging = unflagged.length > 0
			const changed = flagging ? unflagged : cards
			updateCards.mutate({
				cardIds: idsOf(changed),
				// `null` unsets the field; see `cards.update`.
				flaggedAt: flagging ? DateTime.now().toMillis() : null,
				...(cards.length > 1 && {
					undo: {
						title: `${flagging ? 'Flagged' : 'Unflagged'} ${pluralize(changed.length, 'card')}`,
						cards: changed,
					},
				}),
			})
		},
		[updateCards],
	)

	const toggleRetire = useCallback(
		(cards: ReadonlyArray<Card>) => {
			const active = cards.filter(card => card.retiredAt === undefined)
			// Same as `toggleFlag`: retired cards keep their retirement time.
			const retiring = active.length > 0
			const changed = retiring ? active : cards
			// A bulk action counts the cards it changed, even just one.
			const name =
				cards.length === 1 ? 'card' : pluralize(changed.length, 'card')
			updateCards.mutate({
				cardIds: idsOf(changed),
				retiredAt: retiring ? DateTime.now().toMillis() : null,
				...((retiring || cards.length > 1) && {
					undo: {
						title: `${retiring ? 'Retired' : 'Unretired'} ${name}`,
						cards: changed,
					},
				}),
			})
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
