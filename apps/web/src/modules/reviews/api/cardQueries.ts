import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { placeInLine } from '@shared/ordering'
import { useMutation } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { getErrorMessage } from '~/utils/error'

export const cardQueries = {
	listFlagged: () => convexQuery(api.cards.listFlagged, {}),
	search: (query: string) => convexQuery(api.cards.search, { query }),
	listByCollection: (collectionId: Id<'collections'>) =>
		convexQuery(api.cards.listByCollection, { collectionId }),
	detail: (cardId: Id<'cards'>) => convexQuery(api.cards.get, { cardId }),
}

export function useCreateCard() {
	const mutationFn = useConvexMutation(api.cards.create)
	return useMutation({ mutationFn })
}

export function useUpdateCard() {
	const mutationFn = useConvexMutation(api.cards.update)
	return useMutation({ mutationFn })
}

/** Flags, retires, retypes, or moves several cards to another collection at once. */
export function useUpdateCards() {
	const mutationFn = useConvexMutation(api.cards.updateMany)
	return useMutation({ mutationFn })
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
		onError: error =>
			toast.error('Failed to move card', {
				description: getErrorMessage(error),
			}),
	})
}

export function useDeleteCards() {
	const navigate = useNavigate()
	const matchRoute = useMatchRoute()

	const mutationFn = useConvexMutation(api.cards.remove)

	return useMutation({
		mutationFn,
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
