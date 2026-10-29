import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'

import { useCardActions } from '../hooks/useCardActions'
import type { Card } from '../types/review.types'
import { MoveCardDialog } from './MoveCardDialog'

export type CardDialog = 'move' | 'delete' | null

type CardActionDialogsProps = {
	/** The cards the dialogs act on, at least one, in page order. */
	cards: ReadonlyArray<Card>
	dialog: CardDialog
	onDialogChange: (dialog: CardDialog) => void
}

/**
 * The move and delete dialogs behind a card's actions, for one card or
 * several, so every place that offers them words them the same.
 */
export function CardActionDialogs({
	cards,
	dialog,
	onDialogChange,
}: CardActionDialogsProps) {
	const { isDeleting, remove } = useCardActions()
	const isBatch = cards.length > 1
	const close = () => onDialogChange(null)
	const closeOnDismiss = (open: boolean) => {
		if (!open) close()
	}

	return (
		<>
			{dialog === 'move' ? (
				<MoveCardDialog cards={cards} onOpenChange={closeOnDismiss} />
			) : null}

			<DeleteConfirmationDialog
				description={
					isBatch
						? 'These cards and their content will be permanently deleted.'
						: 'This card and its content will be permanently deleted.'
				}
				isPending={isDeleting}
				// Leave the dialog open on failure so the toast has context.
				onConfirm={() => remove(cards, close)}
				onOpenChange={closeOnDismiss}
				open={dialog === 'delete'}
				title={
					isBatch ? `Delete ${cards.length} cards?` : 'Delete card?'
				}
			/>
		</>
	)
}
