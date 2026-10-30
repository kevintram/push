import type { Id } from '@convex/_generated/dataModel'

import { MoveCollectionDialogBase } from '~/modules/collections/components/move-collection'

import { useUpdateCards } from '../api/cardQueries'
import type { Card } from '../types/review.types'

type MoveCardDialogProps = {
	onOpenChange: (open: boolean) => void
	/** The cards to move, at least one, in the order they land in. */
	cards: ReadonlyArray<Card>
}

export function MoveCardDialog({ onOpenChange, cards }: MoveCardDialogProps) {
	const updateCards = useUpdateCards()

	const handleMove = (destination: Id<'collections'>) => {
		updateCards.mutate(
			{
				cardIds: cards.map(card => card._id),
				collectionId: destination,
			},
			{
				onSuccess: () => onOpenChange(false),
			},
		)
	}

	return (
		<MoveCollectionDialogBase
			initialDestination={cards[0]!.collectionId}
			isPending={updateCards.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title={
				cards.length === 1 ? 'Move card' : `Move ${cards.length} cards`
			}
		/>
	)
}
