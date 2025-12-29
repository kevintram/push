import {
	Archive,
	ArchiveRestore,
	GitPullRequestClosed,
	Inbox,
	MoreHorizontal,
	SquareCheck,
	Trash2
} from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import type { Topic } from '~/features/topics/types/topic.types'

interface TopicActionMenuProps {
	topic: Topic
	onRemoveRelationship?: () => void
	removeRelationshipText?: string
	children?: React.ReactNode
	onDelete?: () => void
	trigger?: React.ReactNode
	onTopicUpdateSuccess?: (topic: Topic) => Promise<unknown> | unknown
}

export function TopicActionMenu({
	topic,
	onRemoveRelationship,
	removeRelationshipText = 'Remove as Child',
	children,
	onDelete,
	trigger,
	onTopicUpdateSuccess
}: TopicActionMenuProps) {
	const deleteTopicMutation = useDeleteTopic()
	const updateTopicMutation = useUpdateTopic(onTopicUpdateSuccess)
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()

	const handleDeleteTopic = useCallback(() => {
		deleteTopicMutation.mutate(topic.id, {
			onSuccess: () => {
				onDelete?.()
			}
		})
	}, [deleteTopicMutation, topic.id, onDelete])

	const handleArchiveToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation.mutateAsync({
				id: topic.id,
				archived: !topic.archived
			})
		},
		[updateTopicMutation, topic.id, topic.archived]
	)

	const handleInboxToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation.mutateAsync({
				id: topic.id,
				inboxed: !topic.inboxed
			})
		},
		[updateTopicMutation, topic.id, topic.inboxed]
	)

	const handleLogNow = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			const today = new Date().toISOString().split('T')[0] ?? ''
			const review = await createReviewMutation.mutateAsync({
				topic_id: topic.id,
				rating: 'good',
				description: '',
				scheduled_at: null,
				completed_at: today
			})
			openReviewDialog(review.id)
		},
		[createReviewMutation, topic.id, openReviewDialog]
	)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				{trigger ?? (
					<Button
						className='h-5 w-5 p-0'
						onClick={e => e.stopPropagation()}
						variant='ghost'
					>
						<MoreHorizontal className='h-3 w-3' />
					</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
				<DropdownMenuItem
					disabled={createReviewMutation.isPending}
					onClick={handleLogNow}
				>
					<SquareCheck className='mr-2 h-4 w-4' />
					Log now
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleInboxToggle}>
					{topic.inboxed ? (
						<>
							<Inbox className='mr-2 h-4 w-4' />
							Remove from Inbox
						</>
					) : (
						<>
							<Inbox className='mr-2 h-4 w-4' />
							Add to Inbox
						</>
					)}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleArchiveToggle}>
					{topic.archived ? (
						<>
							<ArchiveRestore className='mr-2 h-4 w-4' />
							Unarchive
						</>
					) : (
						<>
							<Archive className='mr-2 h-4 w-4' />
							Archive
						</>
					)}
				</DropdownMenuItem>
				{children}
				{onRemoveRelationship && (
					<DropdownMenuItem
						onClick={e => {
							e.stopPropagation()
							onRemoveRelationship()
						}}
					>
						<GitPullRequestClosed className='mr-2 h-4 w-4' />
						{removeRelationshipText}
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					onClick={e => {
						e.stopPropagation()
						handleDeleteTopic()
					}}
					variant='destructive'
				>
					<Trash2 className='mr-2 h-4 w-4' />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
