import {
	Archive,
	ArchiveRestore,
	GitPullRequestClosed,
	Inbox,
	MoreHorizontal,
	Trash2
} from 'lucide-react'
import { isValidElement, useCallback, useMemo, useState } from 'react'
import { ConversionConfirmationDialog } from '~/components/ConversionConfirmationDialog'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { useConvertTopicToPractice } from '~/features/topics/api/convertTopicToPractice'
import { useConvertTopicToSource } from '~/features/topics/api/convertTopicToSource'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useTopicChildren } from '~/features/topics/api/getTopicChildren'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { DeleteTopicDialog } from '~/features/topics/components/DeleteTopicDialog'
import type { Topic } from '~/features/topics/types/topic.types'
import type { OnConversionSuccess } from '~/hooks/useConversionNavigate'
import { ConversionError } from '~/utils/ConversionError'
import {
	getTopicToPracticePreview,
	getTopicToSourcePreview
} from '~/utils/conversionPreview'

interface TopicActionMenuProps {
	topic: Topic
	onConvertSuccess?: OnConversionSuccess
	onRemoveRelationship?: () => void
	removeRelationshipText?: string
	children?: React.ReactNode
	onDelete?: () => void
	trigger?: React.ReactNode
	onTopicUpdateSuccess?: (topic: Topic) => Promise<unknown> | unknown
	hideInboxArchive?: boolean
	convertOnly?: boolean
}

export function TopicActionMenu({
	topic,
	onConvertSuccess,
	onRemoveRelationship,
	removeRelationshipText = 'Remove as Child',
	children,
	onDelete,
	trigger,
	onTopicUpdateSuccess,
	hideInboxArchive = false,
	convertOnly = false
}: TopicActionMenuProps) {
	const triggerElement = isValidElement(trigger) ? trigger : undefined
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [convertToSourceOpen, setConvertToSourceOpen] = useState(false)
	const [convertToPracticeOpen, setConvertToPracticeOpen] = useState(false)
	const [convertToSourceError, setConvertToSourceError] = useState<
		string | null
	>(null)
	const [convertToPracticeError, setConvertToPracticeError] = useState<
		string | null
	>(null)
	const deleteTopicMutation = useDeleteTopic()
	const updateTopicMutation = useUpdateTopic(onTopicUpdateSuccess)
	const convertToSourceMutation = useConvertTopicToSource()
	const convertToPracticeMutation = useConvertTopicToPractice()
	const topicChildrenQuery = useTopicChildren(topic.id, {
		enabled: convertToSourceOpen
	})

	const hasChildren = (topic.children_count ?? 0) > 0

	const toSourcePreview = useMemo(() => {
		const preview = getTopicToSourcePreview(topic, {
			childTopics: topicChildrenQuery.data
		})
		const isCheckingChildCoverage =
			convertToSourceOpen &&
			(topic.children_count ?? 0) > 0 &&
			topicChildrenQuery.isPending
		if (!isCheckingChildCoverage) return preview
		return {
			...preview,
			blockers: [
				...preview.blockers,
				'Checking child topics for covering sources'
			]
		}
	}, [
		topic,
		topicChildrenQuery.data,
		topicChildrenQuery.isPending,
		convertToSourceOpen
	])
	const toPracticePreview = useMemo(
		() => getTopicToPracticePreview(topic),
		[topic]
	)

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

	const handleConfirmConvertToSource = useCallback(async () => {
		try {
			const result = await convertToSourceMutation.mutateAsync({
				topicId: topic.id
			})
			setConvertToSourceOpen(false)
			onConvertSuccess?.('source', result.source_id)
		} catch (error) {
			if (error instanceof ConversionError) {
				setConvertToSourceError(error.message)
			} else {
				setConvertToSourceError('Failed to convert topic to source')
			}
		}
	}, [convertToSourceMutation, topic.id, onConvertSuccess])

	const handleConfirmConvertToPractice = useCallback(async () => {
		try {
			const result = await convertToPracticeMutation.mutateAsync({
				topicId: topic.id
			})
			setConvertToPracticeOpen(false)
			onConvertSuccess?.('practice', result.practice_id)
		} catch (error) {
			if (error instanceof ConversionError) {
				setConvertToPracticeError(error.message)
			} else {
				setConvertToPracticeError('Failed to convert topic to practice')
			}
		}
	}, [convertToPracticeMutation, topic.id, onConvertSuccess])

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						triggerElement ?? (
							<Button
								className='h-5 w-5 p-0'
								onClick={e => e.stopPropagation()}
								variant='ghost'
							>
								<MoreHorizontal className='h-3 w-3' />
							</Button>
						)
					}
				/>
				<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
					{convertOnly ? (
						<DropdownMenuGroup>
							<DropdownMenuLabel>Change type</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={e => {
									e.stopPropagation()
									setConvertToSourceOpen(true)
								}}
							>
								Source
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={e => {
									e.stopPropagation()
									setConvertToPracticeOpen(true)
								}}
							>
								Practice
							</DropdownMenuItem>
						</DropdownMenuGroup>
					) : (
						<>
							{!hideInboxArchive && (
								<>
									<DropdownMenuItem onClick={handleInboxToggle}>
										{topic.inboxed ? (
											<>
												<Inbox className='mr-2 h-4 w-4' />
												Remove from Inbox
											</>
										) : (
											<>
												<Inbox className='mr-2 h-4 w-4' />
												Inbox
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
								</>
							)}
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>Convert</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									<DropdownMenuItem
										onClick={e => {
											e.stopPropagation()
											setConvertToSourceOpen(true)
										}}
									>
										Source
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={e => {
											e.stopPropagation()
											setConvertToPracticeOpen(true)
										}}
									>
										Practice
									</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuSub>
						</>
					)}
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

			<DeleteTopicDialog
				onOpenChange={setDeleteDialogOpen}
				onSuccess={onDelete}
				open={deleteDialogOpen}
				topic={topic}
			/>

			<ConversionConfirmationDialog
				blockers={toSourcePreview.blockers}
				entityName={topic.name}
				error={convertToSourceError}
				isPending={convertToSourceMutation.isPending}
				lost={toSourcePreview.lost}
				migrated={toSourcePreview.migrated}
				onConfirm={handleConfirmConvertToSource}
				onOpenChange={open => {
					setConvertToSourceOpen(open)
					if (!open) setConvertToSourceError(null)
				}}
				open={convertToSourceOpen}
				targetEntityType='Source'
			/>

			<ConversionConfirmationDialog
				blockers={toPracticePreview.blockers}
				entityName={topic.name}
				error={convertToPracticeError}
				isPending={convertToPracticeMutation.isPending}
				lost={toPracticePreview.lost}
				migrated={toPracticePreview.migrated}
				onConfirm={handleConfirmConvertToPractice}
				onOpenChange={open => {
					setConvertToPracticeOpen(open)
					if (!open) setConvertToPracticeError(null)
				}}
				open={convertToPracticeOpen}
				targetEntityType='Practice'
			/>
		</>
	)
}
