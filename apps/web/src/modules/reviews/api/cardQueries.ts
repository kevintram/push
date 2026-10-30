import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { Card, CardBatchPatch } from '@convex/validators/cards'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { placeInLine } from '@shared/ordering'
import { useMutation } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'

import { toastError, toastUndo } from '~/components/ui/Toast'

export const cardQueries = {
	listFlagged: () => convexQuery(api.cards.listFlagged, {}),
	search: (query: string) => convexQuery(api.cards.search, { query }),
	listByCollection: (collectionId: Id<'collections'>) =>
		convexQuery(api.cards.listByCollection, { collectionId }),
	detail: (cardId: Id<'cards'>) => convexQuery(api.cards.get, { cardId }),
}

export function useCreateCard() {
	const mutationFn = useConvexMutation(api.cards.create)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to create card', error),
	})
}

export function useUpdateCard() {
	const mutationFn = useConvexMutation(api.cards.update)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to update card', error),
	})
}

type CardsUpdate = CardBatchPatch & {
	cardIds: Array<Id<'cards'>>
	/**
	 * Offers to undo the update under `title`, putting back the patched
	 * fields of `cards` as they are now.
	 */
	undo?: { title: string; cards: ReadonlyArray<Card> }
}

/** Flags, retires, or retypes several cards at once. */
export function useUpdateCards() {
	const updateMany = useConvexMutation(api.cards.updateMany)
	const updateEach = useConvexMutation(api.cards.updateEach)
	return useMutation({
		mutationFn: ({ undo: _undo, ...patch }: CardsUpdate) =>
			updateMany(patch),
		onError: (error, patch) =>
			toastError(plural(patch.cardIds, updateCardsFailure(patch)), error),
		onSuccess: (_, { undo, ...patch }) => {
			if (!undo) return

			toastUndo(undo.title, () =>
				updateEach({
					patches: undo.cards.map(card => ({
						cardId: card._id,
						...(patch.type !== undefined && { type: card.type }),
						// `null` clears a field the card did not have.
						...(patch.flaggedAt !== undefined && {
							flaggedAt: card.flaggedAt ?? null,
						}),
						...(patch.retiredAt !== undefined && {
							retiredAt: card.retiredAt ?? null,
						}),
					})),
				}),
			)
		},
	})
}

function updateCardsFailure(patch: CardBatchPatch) {
	if (patch.type !== undefined) return 'Failed to update card type'
	if (patch.flaggedAt !== undefined) return 'Failed to update card flag'
	if (patch.retiredAt !== undefined) return 'Failed to update card retirement'
	return 'Failed to update card'
}

/** `message`, ending in "card", made plural for several cards. */
function plural(cardIds: ReadonlyArray<unknown>, message: string) {
	return cardIds.length > 1 ? `${message}s` : message
}

/**
 * Reorders cards as one run, possibly into another list of their collection,
 * showing their new place before the server confirms it.
 */
export function useMoveCards() {
	const mutationFn = useConvexMutation(api.cards.move).withOptimisticUpdate(
		(localStore, { cardIds, sectionId, afterId }) => {
			for (const { args, value: cards } of localStore.getAllQueries(
				api.cards.listByCollection,
			)) {
				if (!cards?.some(card => cardIds.includes(card._id))) continue

				const line = cards.filter(
					card => (card.sectionId ?? null) === sectionId,
				)
				// The server rejects the move, so there is nothing to show.
				if (
					afterId !== null &&
					!line.some(card => card._id === afterId)
				) {
					continue
				}

				const { ranks, backfill } = placeInLine(line, cardIds, afterId)
				const backfilled = new Map(
					backfill.map(row => [row._id, row.rank]),
				)
				const placed = new Map(ranks.map(row => [row._id, row.rank]))
				localStore.setQuery(
					api.cards.listByCollection,
					args,
					cards.map(card => {
						const rank = placed.get(card._id)
						if (rank === undefined) {
							const backfilledRank = backfilled.get(card._id)
							return backfilledRank
								? { ...card, rank: backfilledRank }
								: card
						}
						// Drops the old section rather than storing an
						// `undefined` field, which isn't a Convex value.
						const { sectionId: _oldSectionId, ...rest } = card
						return sectionId === null
							? { ...rest, rank }
							: { ...rest, sectionId, rank }
					}),
				)
			}
		},
	)
	return useMutation({
		mutationFn,
		onError: (error, { cardIds }) =>
			toastError(plural(cardIds, 'Failed to move card'), error),
	})
}

export function useDeleteCards() {
	const navigate = useNavigate()
	const matchRoute = useMatchRoute()

	const mutationFn = useConvexMutation(api.cards.remove)

	return useMutation({
		mutationFn,
		onError: (error, { cardIds }) =>
			toastError(plural(cardIds, 'Failed to delete card'), error),
		onSuccess: removed => {
			// if a deleted card is currently open, fall back to its collection
			const open = removed.find(({ _id }) =>
				matchRoute({
					to: '/cards/$cardId',
					params: { cardId: _id },
					fuzzy: true,
				}),
			)
			if (open) {
				void navigate({
					to: '/collection/$collectionId',
					params: { collectionId: open.collectionId },
				})
			}
		},
	})
}
