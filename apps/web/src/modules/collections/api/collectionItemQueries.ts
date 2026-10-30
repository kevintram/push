import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { Section } from '@convex/validators/sections'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

import { toastError, toastUndo } from '~/components/ui/Toast'

type CollectionItemsMove = {
	/** Each in the order it lands in, and as it was before the move. */
	sections: ReadonlyArray<Section>
	/** Each in the order it lands in, and as it was before the move. */
	cards: ReadonlyArray<Card>
	collectionId: Id<'collections'>
	/** What is moving, as the dialog names it: "card", "1 section and 3 cards". */
	name: string
}

/**
 * Moves sections, with their cards, and cards to another collection, offering
 * to put them all back where they were.
 */
export function useMoveCollectionItems() {
	const move = useConvexMutation(api.collectionItems.moveToCollection)
	const moveToPlacements = useConvexMutation(
		api.collectionItems.moveToPlacements,
	)
	return useMutation({
		mutationFn: ({ sections, cards, collectionId }: CollectionItemsMove) =>
			move({
				sectionIds: sections.map(section => section._id),
				cardIds: cards.map(card => card._id),
				collectionId,
			}),
		onError: error => toastError('Failed to move', error),
		onSuccess: (_, { sections, cards, name }) =>
			toastUndo(`Moved ${name}`, () =>
				moveToPlacements({
					sections: sections.map(section => ({
						sectionId: section._id,
						collectionId: section.collectionId,
						rank: section.rank ?? null,
					})),
					cards: cards.map(card => ({
						cardId: card._id,
						collectionId: card.collectionId,
						sectionId: card.sectionId ?? null,
						rank: card.rank ?? null,
					})),
				}),
			),
	})
}

/** Deletes sections, with their cards, and cards. */
export function useDeleteCollectionItems() {
	const mutationFn = useConvexMutation(api.collectionItems.remove)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to delete', error),
	})
}
