import { Trash2 } from 'lucide-react'
import { type ReactElement } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { getTopicDisplayTitle } from '~/modules/topics/utils/topicTree'

type LibraryOutlineDeleteDialogProps = {
	isDeletingTopic: boolean
	onConfirmDeleteTopic: () => void
	onOpenChange: (open: boolean) => void
	pendingDeleteTopic: {
		body: string
		title: string
	} | null
	pendingDeleteTopicId: number | null
}

function getDeleteDescription(
	pendingDeleteTopic: LibraryOutlineDeleteDialogProps['pendingDeleteTopic'],
): string {
	if (pendingDeleteTopic == null) {
		return 'This action cannot be undone.'
	}

	const topicLabel = getTopicDisplayTitle(
		pendingDeleteTopic.title,
		pendingDeleteTopic.body,
	)
	return `Delete ${topicLabel} and all of its subtopics, review cards, and reviews? This action cannot be undone.`
}

export function LibraryOutlineDeleteDialog({
	isDeletingTopic,
	onConfirmDeleteTopic,
	onOpenChange,
	pendingDeleteTopic,
	pendingDeleteTopicId,
}: LibraryOutlineDeleteDialogProps): ReactElement {
	const actionLabel = isDeletingTopic ? 'Deleting...' : 'Delete topic'

	return (
		<AlertDialog
			onOpenChange={onOpenChange}
			open={pendingDeleteTopicId !== null}
		>
			<AlertDialogContent size='sm'>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<Trash2 className='h-5 w-5' />
					</AlertDialogMedia>
					<AlertDialogTitle>{'Delete topic?'}</AlertDialogTitle>
					<AlertDialogDescription>
						{getDeleteDescription(pendingDeleteTopic)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						buttonClassName='w-full sm:w-auto'
						disabled={isDeletingTopic}
					>
						{'Cancel'}
					</AlertDialogCancel>
					<AlertDialogAction
						buttonClassName='w-full sm:w-auto'
						disabled={isDeletingTopic}
						onClick={onConfirmDeleteTopic}
					>
						{actionLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
