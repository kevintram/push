import {
	Archive,
	ArchiveRestore,
	Inbox,
	MoreHorizontal,
	SquareCheck,
	Trash2
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import { useDeleteSource } from '~/features/sources/api/deleteSource'
import { useUpdateSource } from '~/features/sources/api/updateSource'
import { DeleteSourceDialog } from '~/features/sources/components/DeleteSourceDialog'
import type { Source } from '~/features/sources/types/source.types'

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
	const deleteSourceMutation = useDeleteSource()
	const updateSourceMutation = useUpdateSource(onSourceUpdateSuccess)
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()

	const hasChildren = (source.children_count ?? 0) > 0

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
		</>
	)
}
