import {
	Archive,
	ArchiveRestore,
	GitPullRequestClosed,
	Inbox,
	MoreHorizontal,
	RefreshCw,
	Trash2
} from 'lucide-react'
import { isValidElement, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConversionConfirmationDialog } from '~/components/ConversionConfirmationDialog'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useConvertPracticeToSource } from '~/features/practices/api/convertPracticeToSource'
import { useConvertPracticeToTopic } from '~/features/practices/api/convertPracticeToTopic'
import type { OnConversionSuccess } from '~/hooks/useConversionNavigate'
import { ConversionError } from '~/utils/ConversionError'
import {
	getPracticeToSourcePreview,
	getPracticeToTopicPreview
} from '~/utils/conversionPreview'
import { useDeletePractice } from '../api/deletePractice'
import { useUpdatePractice } from '../api/updatePractice'
import type { Practice } from '../types/practice.types'

interface PracticeActionMenuProps {
	practice: Practice
	onConvertSuccess?: OnConversionSuccess
	children?: React.ReactNode
	onDelete?: () => void
	trigger?: React.ReactNode
	onPracticeUpdateSuccess?: (practice: Practice) => Promise<unknown> | unknown
	onRemoveRelationship?: () => void
	removeRelationshipText?: string
}

export function PracticeActionMenu({
	practice,
	onConvertSuccess,
	children,
	onDelete,
	trigger,
	onPracticeUpdateSuccess,
	onRemoveRelationship,
	removeRelationshipText = 'Remove'
}: PracticeActionMenuProps) {
	const triggerElement = isValidElement(trigger) ? trigger : undefined
	const [convertToTopicOpen, setConvertToTopicOpen] = useState(false)
	const [convertToSourceOpen, setConvertToSourceOpen] = useState(false)
	const deletePracticeMutation = useDeletePractice()
	const updatePracticeMutation = useUpdatePractice(onPracticeUpdateSuccess)
	const convertToTopicMutation = useConvertPracticeToTopic()
	const convertToSourceMutation = useConvertPracticeToSource()

	const toTopicPreview = useMemo(
		() => getPracticeToTopicPreview(practice),
		[practice]
	)
	const toSourcePreview = useMemo(
		() => getPracticeToSourcePreview(practice),
		[practice]
	)

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

	const handleConfirmConvertToTopic = useCallback(async () => {
		try {
			const result = await convertToTopicMutation.mutateAsync({
				practiceId: practice.id
			})
			setConvertToTopicOpen(false)
			onConvertSuccess?.('topic', result.topic_id)
		} catch (error) {
			setConvertToTopicOpen(false)
			if (error instanceof ConversionError) {
				toast.error(error.message)
			} else {
				toast.error('Failed to convert practice to topic')
			}
		}
	}, [convertToTopicMutation, practice.id, onConvertSuccess])

	const handleConfirmConvertToSource = useCallback(async () => {
		try {
			const result = await convertToSourceMutation.mutateAsync({
				practiceId: practice.id
			})
			setConvertToSourceOpen(false)
			onConvertSuccess?.('source', result.source_id)
		} catch (error) {
			setConvertToSourceOpen(false)
			if (error instanceof ConversionError) {
				toast.error(error.message)
			} else {
				toast.error('Failed to convert practice to source')
			}
		}
	}, [convertToSourceMutation, practice.id, onConvertSuccess])

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
					<DropdownMenuItem onClick={handleInboxToggle}>
						{practice.inboxed ? (
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
					<DropdownMenuSeparator />
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
							setConvertToSourceOpen(true)
						}}
					>
						<RefreshCw className='mr-2 h-4 w-4' />
						Convert to Source
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
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={handleDeletePractice}
						variant='destructive'
					>
						<Trash2 className='mr-2 h-4 w-4' />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<ConversionConfirmationDialog
				blockers={toTopicPreview.blockers}
				entityName={practice.prompt}
				isPending={convertToTopicMutation.isPending}
				lost={toTopicPreview.lost}
				migrated={toTopicPreview.migrated}
				onConfirm={handleConfirmConvertToTopic}
				onOpenChange={setConvertToTopicOpen}
				open={convertToTopicOpen}
				targetEntityType='Topic'
			/>

			<ConversionConfirmationDialog
				blockers={toSourcePreview.blockers}
				entityName={practice.prompt}
				isPending={convertToSourceMutation.isPending}
				lost={toSourcePreview.lost}
				migrated={toSourcePreview.migrated}
				onConfirm={handleConfirmConvertToSource}
				onOpenChange={setConvertToSourceOpen}
				open={convertToSourceOpen}
				targetEntityType='Source'
			/>
		</>
	)
}
