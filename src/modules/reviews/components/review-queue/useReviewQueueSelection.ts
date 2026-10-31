import { useCallback, useEffect, useState } from 'react'

import type { Card } from '~/modules/reviews/types/review.types'

type Selection = {
	id: Card['_id'] | null
	index: number
}

function resolveIndex(cards: ReadonlyArray<Card>, selection: Selection) {
	if (cards.length === 0) return -1
	if (selection.id === null)
		return Math.min(selection.index, cards.length - 1)

	const index = cards.findIndex(({ _id }) => _id === selection.id)
	return index === -1 ? Math.min(selection.index, cards.length - 1) : index
}

/** Keeps the selected card stable by identity as a live review queue changes. */
export function useReviewQueueSelection(cards: ReadonlyArray<Card>) {
	const [selection, setSelection] = useState<Selection>(() => ({
		id: cards[0]?._id ?? null,
		index: 0,
	}))
	// A card to select once it is in the queue, which takes a moment after
	// undoing its review.
	const [returningId, setReturningId] = useState<Card['_id'] | null>(null)
	const index = resolveIndex(cards, selection)
	const currentCard = cards[index] ?? null
	const resolvedId = currentCard?._id ?? null

	useEffect(() => {
		if (resolvedId === null) return

		setSelection(current => {
			if (current.id === resolvedId && current.index === index)
				return current
			return { id: resolvedId, index }
		})
	}, [index, resolvedId])

	useEffect(() => {
		if (returningId === null) return

		const returnedIndex = cards.findIndex(({ _id }) => _id === returningId)
		if (returnedIndex === -1) return

		setSelection({ id: returningId, index: returnedIndex })
		setReturningId(null)
	}, [cards, returningId])

	const goPrevious = useCallback(() => {
		const previousIndex = index - 1
		const previous = cards[previousIndex]
		if (previous) setSelection({ id: previous._id, index: previousIndex })
	}, [cards, index])

	const goNext = useCallback(() => {
		const nextIndex = index + 1
		const next = index === -1 ? undefined : cards[nextIndex]
		if (next) setSelection({ id: next._id, index: nextIndex })
	}, [cards, index])

	const selectCard = useCallback(
		(cardId: Card['_id']) => {
			const selectedIndex = cards.findIndex(({ _id }) => _id === cardId)
			const selectedCard = cards[selectedIndex]
			if (selectedCard) {
				setSelection({ id: selectedCard._id, index: selectedIndex })
			}
		},
		[cards],
	)

	return {
		index,
		currentCard,
		canGoPrevious: index > 0,
		canGoNext: index !== -1 && index < cards.length - 1,
		goPrevious,
		goNext,
		selectCard,
		/** Selects `cardId` as soon as it is in the queue. */
		returnTo: setReturningId,
	}
}
