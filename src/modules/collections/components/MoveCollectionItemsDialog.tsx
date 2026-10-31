import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { Section } from '@convex/validators/sections'

import { useMoveCollectionItems } from '~/modules/collections/api/collectionItemQueries'

import { MoveCollectionDialogBase } from './move-collection'

type MoveCollectionItemsDialogProps = {
	onOpenChange: (open: boolean) => void
	/** The collection the items are in, where the picker starts. */
	collectionId: Id<'collections'>
	/** In page order, which is the order they land in. */
	sections: ReadonlyArray<Section>
	/** In page order, which is the order they land in. */
	cards: ReadonlyArray<Card>
	/** What is moving, as in "section" or "1 section and 3 cards". */
	name: string
}

/** Moves sections, with their cards, and cards to another collection. */
export function MoveCollectionItemsDialog({
	onOpenChange,
	collectionId,
	sections,
	cards,
	name,
}: MoveCollectionItemsDialogProps) {
	const moveItems = useMoveCollectionItems()

	const handleMove = (destination: Id<'collections'>) => {
		moveItems.mutate(
			{ sections, cards, collectionId: destination, name },
			{ onSuccess: () => onOpenChange(false) },
		)
	}

	return (
		<MoveCollectionDialogBase
			initialDestination={collectionId}
			isPending={moveItems.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title={`Move ${name}`}
		/>
	)
}
