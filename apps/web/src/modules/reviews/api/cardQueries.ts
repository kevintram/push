import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'

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
