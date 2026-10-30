import type { Id } from '@convex/_generated/dataModel'

import { useUpdateCollection } from '~/modules/collections/api/collectionQueries'

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
	const updateCollection = useUpdateCollection()

	const handleMove = (destination: Id<'collections'> | null) => {
		updateCollection.mutate(
			{
				collectionId,
				parentId: destination ?? null,
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
			isPending={updateCollection.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title='Move collection'
		/>
	)
}
