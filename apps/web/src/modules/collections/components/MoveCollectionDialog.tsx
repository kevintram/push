import type { Id } from '@convex/_generated/dataModel'

import { useMoveCollection } from '~/modules/collections/api/collectionQueries'

import { MoveCollectionDialogBase } from './move-collection'

type MoveCollectionDialogProps = {
	onOpenChange: (open: boolean) => void
	parentId: Id<'collections'> | undefined
	collectionId: Id<'collections'>
}

export function MoveCollectionDialog({
	onOpenChange,
	parentId,
	collectionId,
}: MoveCollectionDialogProps) {
	const moveCollection = useMoveCollection()

	const handleMove = (destination: Id<'collections'> | null) => {
		moveCollection.mutate(
			{
				collectionId,
				parentId: destination,
				fromParentId: parentId ?? null,
			},
			{
				onSuccess: () => onOpenChange(false),
			},
		)
	}

	return (
		<MoveCollectionDialogBase
			allowRoot
			excludeCollectionId={collectionId}
			initialDestination={parentId ?? null}
			isPending={moveCollection.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title='Move collection'
		/>
	)
}
