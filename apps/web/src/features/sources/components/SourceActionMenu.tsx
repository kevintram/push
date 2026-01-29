import { useNavigate } from '@tanstack/react-router'
import {
	Archive,
	ArchiveRestore,
	Inbox,
	MoreHorizontal,
	RefreshCw,
	SquareCheck,
	Trash2
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConversionConfirmationDialog } from '~/components/ConversionConfirmationDialog'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import { useConvertSourceToPractice } from '~/features/sources/api/convertSourceToPractice'
import { useConvertSourceToTopic } from '~/features/sources/api/convertSourceToTopic'
import { useDeleteSource } from '~/features/sources/api/deleteSource'
import { useUpdateSource } from '~/features/sources/api/updateSource'
import { DeleteSourceDialog } from '~/features/sources/components/DeleteSourceDialog'
import type { Source } from '~/features/sources/types/source.types'
import { ConversionError } from '~/utils/ConversionError'
import {
	getSourceToPracticePreview,
	getSourceToTopicPreview
} from '~/utils/conversionPreview'

interface SourceActionMenuProps {
	source: Source
	onRemoveRelationship?: () => void
	removeRelationshipText?: string
	children?: React.ReactNode
	onDelete?: () => void
	trigger?: React.ReactNode
	onSourceUpdateSuccess?: (source: Source) => Promise<unknown> | unknown
}

export function SourceActionMenu({
	source,
	onRemoveRelationship,
	removeRelationshipText = 'Remove as Child',
	children,
	onDelete,
	trigger,
	onSourceUpdateSuccess
}: SourceActionMenuProps) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [convertToTopicOpen, setConvertToTopicOpen] = useState(false)
	const [convertToPracticeOpen, setConvertToPracticeOpen] = useState(false)
	const navigate = useNavigate()
	const deleteSourceMutation = useDeleteSource()
	const updateSourceMutation = useUpdateSource(onSourceUpdateSuccess)
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()
	const convertToTopicMutation = useConvertSourceToTopic()
	const convertToPracticeMutation = useConvertSourceToPractice()

	const hasChildren = (source.children_count ?? 0) > 0

	const toTopicPreview = useMemo(
		() => getSourceToTopicPreview(source),
		[source]
	)
	const toPracticePreview = useMemo(
		() => getSourceToPracticePreview(source),
		[source]
	)

	const handleDeleteSource = useCallback(() => {
		if (hasChildren) {
			setDeleteDialogOpen(true)
		} else {
			deleteSourceMutation.mutate(source.id, {
				onSuccess: () => {
					onDelete?.()
				}
			})
		}
	}, [deleteSourceMutation, source.id, onDelete, hasChildren])

	const handleArchiveToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateSourceMutation.mutateAsync({
				id: source.id,
				archived: !source.archived
			})
		},
		[updateSourceMutation, source.id, source.archived]
	)

	const handleInboxToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateSourceMutation.mutateAsync({
				id: source.id,
				inboxed: !source.inboxed
			})
		},
		[updateSourceMutation, source.id, source.inboxed]
	)

	const handleLogNow = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			const today = new Date().toISOString().split('T')[0] ?? ''
			const review = await createReviewMutation.mutateAsync({
				source_id: source.id,
				rating: 'good',
				description: '',
				scheduled_at: null,
				completed_at: today
			})
			openReviewDialog(review.id)
		},
		[createReviewMutation, source.id, openReviewDialog]
	)

	const handleConfirmConvertToTopic = useCallback(async () => {
		try {
			const result = await convertToTopicMutation.mutateAsync({
				sourceId: source.id
			})
			setConvertToTopicOpen(false)
			navigate({
				to: '/topics/$topicId',
				params: { topicId: String(result.topic_id) }
			})
		} catch (error) {
			if (error instanceof ConversionError) {
				toast.error(error.message)
			} else {
				toast.error('Failed to convert source to topic')
			}
		}
	}, [convertToTopicMutation, source.id, navigate])

	const handleConfirmConvertToPractice = useCallback(async () => {
		try {
			const result = await convertToPracticeMutation.mutateAsync({
				sourceId: source.id
			})
			setConvertToPracticeOpen(false)
			navigate({
				to: '/practices/$practiceId',
				params: { practiceId: String(result.practice_id) }
			})
		} catch (error) {
			if (error instanceof ConversionError) {
				toast.error(error.message)
			} else {
				toast.error('Failed to convert source to practice')
			}
		}
	}, [convertToPracticeMutation, source.id, navigate])

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
						{source.inboxed ? (
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
						{source.archived ? (
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
							{removeRelationshipText}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						onClick={e => {
							e.stopPropagation()
							setConvertToTopicOpen(true)
						}}
					>
						<RefreshCw className='mr-2 h-4 w-4' />
						Convert to Topic
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={e => {
							e.stopPropagation()
							setConvertToPracticeOpen(true)
						}}
					>
						<RefreshCw className='mr-2 h-4 w-4' />
						Convert to Practice
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={e => {
							e.stopPropagation()
							handleDeleteSource()
						}}
						variant='destructive'
					>
						<Trash2 className='mr-2 h-4 w-4' />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<DeleteSourceDialog
				onOpenChange={setDeleteDialogOpen}
				onSuccess={onDelete}
				open={deleteDialogOpen}
				source={source}
			/>

			<ConversionConfirmationDialog
				blockers={toTopicPreview.blockers}
				entityName={source.title}
				isPending={convertToTopicMutation.isPending}
				lost={toTopicPreview.lost}
				migrated={toTopicPreview.migrated}
				onConfirm={handleConfirmConvertToTopic}
				onOpenChange={setConvertToTopicOpen}
				open={convertToTopicOpen}
				targetEntityType='Topic'
			/>

			<ConversionConfirmationDialog
				blockers={toPracticePreview.blockers}
				entityName={source.title}
				isPending={convertToPracticeMutation.isPending}
				lost={toPracticePreview.lost}
				migrated={toPracticePreview.migrated}
				onConfirm={handleConfirmConvertToPractice}
				onOpenChange={setConvertToPracticeOpen}
				open={convertToPracticeOpen}
				targetEntityType='Practice'
			/>
		</>
	)
}
