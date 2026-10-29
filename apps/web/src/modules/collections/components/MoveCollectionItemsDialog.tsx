import type { Id } from '@convex/_generated/dataModel'

import { useMoveCollectionItems } from '~/modules/collections/api/collectionItemQueries'

import { MoveCollectionDialogBase } from './move-collection'

type MoveCollectionItemsDialogProps = {
	onOpenChange: (open: boolean) => void
	/** The collection the items are in, where the picker starts. */
	collectionId: Id<'collections'>
	/** In page order, which is the order they land in. */
	sectionIds: ReadonlyArray<Id<'sections'>>
	/** In page order, which is the order they land in. */
	cardIds: ReadonlyArray<Id<'cards'>>
	title: string
}

/** Moves sections, with their cards, and cards to another collection. */
export function MoveCollectionItemsDialog({
	onOpenChange,
	collectionId,
	sectionIds,
	cardIds,
	title,
}: MoveCollectionItemsDialogProps) {
	const moveItems = useMoveCollectionItems()

	const handleMove = (destination: Id<'collections'>) => {
		moveItems.mutate(
			{
				sectionIds: [...sectionIds],
				cardIds: [...cardIds],
				collectionId: destination,
			},
			{ onSuccess: () => onOpenChange(false) },
		)
	}

	return (
		<MoveCollectionDialogBase
			initialDestination={collectionId}
			isPending={moveItems.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title={title}
		/>
	)
}
