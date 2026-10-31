import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { Section } from '@convex/validators/sections'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import {
	toastError,
	toastName,
	toastTitle,
	toastUndo,
} from '~/components/ui/Toast'

import { useCollectionName } from './collectionQueries'

type CollectionItemsMove = {
	/** Each in the order it lands in, and as it was before the move. */
	sections: ReadonlyArray<Section>
	/** Each in the order it lands in, and as it was before the move. */
	cards: ReadonlyArray<Card>
	collectionId: Id<'collections'>
	/**
	 * What is moving, as the dialog names it: "card", "1 section and 3 cards".
	 * A lone item goes by its own name instead.
	 */
	name: string
}

/**
 * Moves sections, with their cards, and cards to another collection, offering
 * to open that collection or put them all back where they were.
 */
export function useMoveCollectionItems() {
	const navigate = useNavigate()
	const collectionName = useCollectionName()
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
		onSuccess: (_, { sections, cards, collectionId, name }) => {
			const destination = collectionName(collectionId)
			toastUndo({
				title: toastTitle(
					'Moved ',
					movedName(sections, cards) ?? name,
					...(destination ? [' to ', destination] : []),
				),
				open: {
					label: 'Open',
					onClick: () =>
						void navigate({
							to: '/collection/$collectionId',
							params: { collectionId },
						}),
				},
				undo: () =>
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
			})
		},
	})
}

/** The bold name of a lone section or card, or nothing for several. */
function movedName(
	sections: ReadonlyArray<Section>,
	cards: ReadonlyArray<Card>,
) {
	if (sections.length + cards.length !== 1) return undefined
	const [section] = sections
	return section
		? toastName(section.title, 'Untitled section')
		: toastName(cards[0]!.primaryText)
}

/** Deletes sections, with their cards, and cards. */
export function useDeleteCollectionItems() {
	const mutationFn = useConvexMutation(api.collectionItems.remove)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to delete', error),
	})
}
