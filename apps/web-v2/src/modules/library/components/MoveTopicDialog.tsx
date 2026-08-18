import type { Id } from '@convex/_generated/dataModel'
import { toast } from 'sonner'

import { useUpdateTopic } from '~/modules/library/api/topicQueries'

import { MoveTopicDialogBase } from './move-topic'

type MoveTopicDialogProps = {
	onOpenChange: (open: boolean) => void
	parentId: Id<'topics'> | undefined
	topicId: Id<'topics'>
}

export function MoveTopicDialog({
	onOpenChange,
	parentId,
	topicId,
}: MoveTopicDialogProps) {
	const updateTopic = useUpdateTopic()

	const handleMove = (destination: Id<'topics'> | null) => {
		updateTopic.mutate(
			{
				topicId,
				parentId: destination ?? null,
			},
			{
				onError: () => toast.error('Failed to move topic'),
				onSuccess: () => onOpenChange(false),
			},
		)
	}

	return (
		<MoveTopicDialogBase
			allowLibraryRoot
			description='Subtopics and review cards will move with this topic.'
			excludeTopicId={topicId}
			initialDestination={parentId ?? null}
			isPending={updateTopic.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title='Move topic'
		/>
	)
}
