import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { placeInLine } from '@shared/ordering'
import { useMutation } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'

import { toast } from '~/components/ui/Toast'
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

/**
 * Reorders a card, or moves it into another list of its collection, showing
 * its new place before the server confirms it.
 */
export function useMoveCard() {
	const mutationFn = useConvexMutation(api.cards.move).withOptimisticUpdate(
		(localStore, { cardId, sectionId, afterId }) => {
			for (const { args, value: cards } of localStore.getAllQueries(
				api.cards.listByCollection,
			)) {
				if (!cards?.some(card => card._id === cardId)) continue

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

				const { rank, backfill } = placeInLine(line, cardId, afterId)
				const ranks = new Map(backfill.map(row => [row._id, row.rank]))
				localStore.setQuery(
					api.cards.listByCollection,
					args,
					cards.map(card => {
						if (card._id !== cardId) {
							const backfilled = ranks.get(card._id)
							return backfilled
								? { ...card, rank: backfilled }
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
			toast.add({
				description: getErrorMessage(error),
				title: 'Failed to move card',
				type: 'error',
			}),
	})
}

export function useDeleteCard() {
	const navigate = useNavigate()
	const matchRoute = useMatchRoute()

	const mutationFn = useConvexMutation(api.cards.remove)

	return useMutation({
		mutationFn,
		onSuccess: ({ _id, collectionId }) => {
			// if deleted card is currently open, fall back to its collection
			if (
				matchRoute({
					to: '/cards/$cardId',
					params: { cardId: _id },
					fuzzy: true,
				})
			) {
				void navigate({
					to: '/collection/$collectionId',
					params: { collectionId },
				})
			}
		},
	})
}
