import type { Id } from '@convex/_generated/dataModel'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import { useDeleteCollectionItems } from '~/modules/collections/api/collectionItemQueries'
import { MoveCollectionItemsDialog } from '~/modules/collections/components/MoveCollectionItemsDialog'

import { nameItems, type SelectionContents } from './selectionContents'

export type SelectionDialog = 'move' | 'delete' | null

/** What deleting `contents` takes with it, in a sentence. */
function describeDeletion({ sections, cards }: SelectionContents): string {
	if (sections.length === 0) {
		return cards.length === 1
			? 'This card and its content will be permanently deleted.'
			: 'These cards and their content will be permanently deleted.'
	}

	const deleted =
		sections.length === 1
			? 'This section, its cards,'
			: 'These sections, their cards,'
	const others = cards.length > 0 ? ' the other selected cards,' : ''
	return `${deleted}${others} and their review history will be permanently deleted.`
}

type SelectionDialogsProps = {
	/** The collection the page shows, where the move picker starts. */
	collectionId: Id<'collections'>
	contents: SelectionContents
	dialog: SelectionDialog
	onDialogChange: (dialog: SelectionDialog) => void
}

/** The move and delete dialogs behind the selection's action bar. */
export function SelectionDialogs({
	collectionId,
	contents,
	dialog,
	onDialogChange,
}: SelectionDialogsProps) {
	const deleteItems = useDeleteCollectionItems()
	const items = {
		sectionIds: contents.sections.map(section => section._id),
		cardIds: contents.cards.map(card => card._id),
	}
	const close = () => onDialogChange(null)
	const closeOnDismiss = (open: boolean) => {
		if (!open) close()
	}

	return (
		<>
			{dialog === 'move' ? (
				<MoveCollectionItemsDialog
					collectionId={collectionId}
					{...items}
					onOpenChange={closeOnDismiss}
					title={`Move ${nameItems(contents)}`}
				/>
			) : null}

			<DeleteConfirmationDialog
				description={describeDeletion(contents)}
				isPending={deleteItems.isPending}
				onConfirm={() =>
					// Leave the dialog open on failure so the toast has context.
					deleteItems.mutate(items, { onSuccess: close })
				}
				onOpenChange={closeOnDismiss}
				open={dialog === 'delete'}
				title={`Delete ${nameItems(contents)}?`}
			/>
		</>
	)
}
