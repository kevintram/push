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
import { useDeletePractice } from '../api/deletePractice'
import { useUpdatePractice } from '../api/updatePractice'
import type { Practice } from '../types/practice.types'

interface PracticeActionMenuProps {
	practice: Practice
	children?: React.ReactNode
	onDelete?: () => void
	trigger?: React.ReactNode
	onPracticeUpdateSuccess?: (practice: Practice) => Promise<unknown> | unknown
	onRemoveRelationship?: () => void
	removeRelationshipText?: string
}

export function PracticeActionMenu({
	practice,
	children,
	onDelete,
	trigger,
	onPracticeUpdateSuccess,
	onRemoveRelationship,
	removeRelationshipText = 'Remove'
}: PracticeActionMenuProps) {
	const deletePracticeMutation = useDeletePractice()
	const updatePracticeMutation = useUpdatePractice(onPracticeUpdateSuccess)
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()

	const handleDeletePractice = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation()
			deletePracticeMutation.mutate(practice.id, {
				onSuccess: () => {
					onDelete?.()
				}
			})
		},
		[deletePracticeMutation, practice.id, onDelete]
	)

	const handleArchiveToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updatePracticeMutation.mutateAsync({
				id: practice.id,
				archived: !practice.archived
			})
		},
		[updatePracticeMutation, practice.id, practice.archived]
	)

	const handleInboxToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updatePracticeMutation.mutateAsync({
				id: practice.id,
				inboxed: !practice.inboxed
			})
		},
		[updatePracticeMutation, practice.id, practice.inboxed]
	)

	const handleLogNow = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			const today = new Date().toISOString().split('T')[0] ?? ''
			const review = await createReviewMutation.mutateAsync({
				practice_id: practice.id,
				rating: 'good',
				description: '',
				scheduled_at: null,
				completed_at: today
			})
			openReviewDialog(review.id)
		},
		[createReviewMutation, practice.id, openReviewDialog]
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
					{practice.inboxed ? (
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
					{practice.archived ? (
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
				<DropdownMenuItem onClick={handleDeletePractice} variant='destructive'>
					<Trash2 className='mr-2 h-4 w-4' />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
