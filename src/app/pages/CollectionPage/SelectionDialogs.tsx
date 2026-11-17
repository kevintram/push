import type { Id } from '@convex/_generated/dataModel'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import { toastName } from '~/components/ui/Toast'
import { useDeleteCollectionItems } from '~/modules/collections/api/collectionItemQueries'
import { MoveCollectionItemsDialog } from '~/modules/collections/components/MoveCollectionItemsDialog'
import { pluralize } from '~/utils/pluralize'

import { nameItems, type SelectionContents } from './selectionContents'

export type SelectionDialog = 'move' | 'delete' | null

/** What deleting `contents` takes with it, including cards inside sections. */
function describeDeletion({
	sections,
	cards,
	coveredCards,
}: SelectionContents): string {
	if (sections.length === 0) {
		return coveredCards.length === 1
			? 'This card and its reviews'
			: `All ${coveredCards.length} cards and their reviews`
	}
	if (sections.length === 1 && cards.length === 0) {
		return 'This section and all its cards'
	}
	if (coveredCards.length === 0) {
		return `These ${sections.length} sections and all their cards`
	}
	const sectionName =
		sections.length === 1
			? 'This section'
			: `These ${sections.length} sections`
	return `${sectionName}, all ${pluralize(coveredCards.length, 'card')}, and their reviews`
}

/** Full text for a single target; bulk selections use counts instead. */
function singleItemText(contents: SelectionContents): string | undefined {
	const { sections, cards } = contents
	if (sections.length === 1 && cards.length === 0) {
		return sections[0]!.title.trim() || 'Untitled section'
	}
	if (sections.length === 0 && cards.length === 1) {
		return cards[0]!.prompt.trim() || 'Untitled card'
	}
	return undefined
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
	const singleText = singleItemText(contents)
	const items = {
		sectionIds: contents.sections.map(section => section._id),
		cardIds: contents.cards.map(card => card._id),
		name: singleText ? toastName(singleText) : nameItems(contents),
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
					sections={contents.sections}
					cards={contents.cards}
					onOpenChange={closeOnDismiss}
					name={nameItems(contents)}
				/>
			) : null}

			<DeleteConfirmationDialog
				description={
					<>
						{describeDeletion(contents)} will be{' '}
						<strong>permanently</strong> deleted.
					</>
				}
				isPending={deleteItems.isPending}
				onConfirm={() =>
					// Leave the dialog open on failure so the toast has context.
					deleteItems.mutate(items, { onSuccess: close })
				}
				onOpenChange={closeOnDismiss}
				open={dialog === 'delete'}
				title={
					singleText
						? `Delete “${singleText}”?`
						: `Delete ${nameItems(contents)}?`
				}
			/>
		</>
	)
}
