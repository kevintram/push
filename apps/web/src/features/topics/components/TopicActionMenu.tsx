import { useNavigate } from '@tanstack/react-router'
import {
	Archive,
	ArchiveRestore,
	GitPullRequestClosed,
	Inbox,
	MoreHorizontal,
	RefreshCw,
	SquareCheck,
	Trash2
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import {
	ConversionError,
	useConvertTopicToPractice
} from '~/features/topics/api/convertTopicToPractice'
import { useConvertTopicToSource } from '~/features/topics/api/convertTopicToSource'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { DeleteTopicDialog } from '~/features/topics/components/DeleteTopicDialog'
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
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const navigate = useNavigate()
	const deleteTopicMutation = useDeleteTopic()
	const updateTopicMutation = useUpdateTopic(onTopicUpdateSuccess)
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()
	const convertToSourceMutation = useConvertTopicToSource()
	const convertToPracticeMutation = useConvertTopicToPractice()

	const hasChildren = (topic.children_count ?? 0) > 0

	const handleDeleteTopic = useCallback(() => {
		if (hasChildren) {
			setDeleteDialogOpen(true)
		} else {
			deleteTopicMutation.mutate(topic.id, {
				onSuccess: () => {
					onDelete?.()
				}
			})
		}
	}, [deleteTopicMutation, topic.id, onDelete, hasChildren])

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

	const handleConvertToSource = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			try {
				const result = await convertToSourceMutation.mutateAsync({
					topicId: topic.id
				})
				navigate({
					to: '/sources/$sourceId',
					params: { sourceId: String(result.source_id) }
				})
			} catch (error) {
				if (error instanceof ConversionError) {
					toast.error(error.message)
				} else {
					toast.error('Failed to convert topic to source')
				}
			}
		},
		[convertToSourceMutation, topic.id, navigate]
	)

	const handleConvertToPractice = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			try {
				const result = await convertToPracticeMutation.mutateAsync({
					topicId: topic.id
				})
				navigate({
					to: '/practices/$practiceId',
					params: { practiceId: String(result.practice_id) }
				})
			} catch (error) {
				if (error instanceof ConversionError) {
					toast.error(error.message)
				} else {
					toast.error('Failed to convert topic to practice')
				}
			}
		},
		[convertToPracticeMutation, topic.id, navigate]
	)

	return (
		<>
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
						disabled={convertToSourceMutation.isPending}
						onClick={handleConvertToSource}
					>
						<RefreshCw className='mr-2 h-4 w-4' />
						Convert to Source
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={convertToPracticeMutation.isPending}
						onClick={handleConvertToPractice}
					>
						<RefreshCw className='mr-2 h-4 w-4' />
						Convert to Practice
					</DropdownMenuItem>
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

			<DeleteTopicDialog
				onOpenChange={setDeleteDialogOpen}
				onSuccess={onDelete}
				open={deleteDialogOpen}
				topic={topic}
			/>
		</>
	)
}
