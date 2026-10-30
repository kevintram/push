import type { Id } from '@convex/_generated/dataModel'

import { toast } from '~/components/ui/Toast'
import { MoveCollectionDialogBase } from '~/modules/collections/components/move-collection'

import { useUpdateCard } from '../api/cardQueries'
import type { Card } from '../types/review.types'

type MoveCardDialogProps = {
	onOpenChange: (open: boolean) => void
	card: Card
}

export function MoveCardDialog({ onOpenChange, card }: MoveCardDialogProps) {
	const updateCard = useUpdateCard()

	const handleMove = (destination: Id<'collections'>) => {
		updateCard.mutate(
			{
				cardId: card._id,
				collectionId: destination,
			},
			{
				onError: () =>
					toast.add({
						title: 'Failed to move card',
						type: 'error',
					}),
				onSuccess: () => onOpenChange(false),
			},
		)
	}

	return (
		<MoveCollectionDialogBase
			initialDestination={card.collectionId}
			isPending={updateCard.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title='Move card'
		/>
	)
}
