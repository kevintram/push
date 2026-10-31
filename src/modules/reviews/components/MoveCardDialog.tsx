import type { Id } from '@convex/_generated/dataModel'

import { useMoveCollectionItems } from '~/modules/collections/api/collectionItemQueries'
import { MoveCollectionDialogBase } from '~/modules/collections/components/move-collection'
import { pluralize } from '~/utils/pluralize'

import type { Card } from '../types/review.types'

type MoveCardDialogProps = {
	onOpenChange: (open: boolean) => void
	/** The cards to move, at least one, in the order they land in. */
	cards: ReadonlyArray<Card>
}

export function MoveCardDialog({ onOpenChange, cards }: MoveCardDialogProps) {
	const moveItems = useMoveCollectionItems()
	const name = cards.length === 1 ? 'card' : pluralize(cards.length, 'card')

	const handleMove = (destination: Id<'collections'>) => {
		moveItems.mutate(
			{ sections: [], cards, collectionId: destination, name },
			{
				onSuccess: () => onOpenChange(false),
			},
		)
	}

	return (
		<MoveCollectionDialogBase
			initialDestination={cards[0]!.collectionId}
			isPending={moveItems.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title={`Move ${name}`}
		/>
	)
}
