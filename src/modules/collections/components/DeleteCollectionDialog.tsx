import type { Id } from '@convex/_generated/dataModel'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import { useDeleteCollection } from '~/modules/collections/api/collectionQueries'

type DeleteCollectionDialogProps = {
	collectionId: Id<'collections'>
	onOpenChange: (open: boolean) => void
	open: boolean
	title: string
}

export function DeleteCollectionDialog({
	collectionId,
	onOpenChange,
	open,
	title,
}: DeleteCollectionDialogProps) {
	const deleteCollection = useDeleteCollection()

	const handleConfirm = () => {
		deleteCollection.mutate(
			{ collectionId },
			{ onSuccess: () => onOpenChange(false) },
		)
	}

	return (
		<DeleteConfirmationDialog
			description={
				<>
					This collection and all its cards will be{' '}
					<strong>permanently</strong> deleted.
				</>
			}
			isPending={deleteCollection.isPending}
			onConfirm={handleConfirm}
			onOpenChange={onOpenChange}
			open={open}
			title={`Delete “${title.trim() || 'Untitled collection'}”?`}
		/>
	)
}
