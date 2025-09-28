import {
	useDeleteMutation,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { Link } from '@tanstack/react-router'
import {
	Archive,
	ArchiveRestore,
	ExternalLink,
	MoreHorizontal,
	Trash
} from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'

interface TopicDialogProps {
	topic: Topic | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function TopicDialog({ topic, open, onOpenChange }: TopicDialogProps) {
	const { mutateAsync: updateTopicMutation } = useUpdateMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	const { mutateAsync: deleteTopic } = useDeleteMutation(
		supabase.from('topics'),
		['id'],
		'*',
		{
			onSuccess: () => {
				onOpenChange(false)
			}
		}
	)

	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (topic?.id) {
				updateTopicMutation({ id: topic.id, notes: newNotes })
			}
		},
		[updateTopicMutation, topic?.id]
	)

	const updateNameMutation = useCallback(
		(newTitle: string) => {
			if (!topic) return
			updateTopicMutation({ id: topic.id, name: newTitle })
		},
		[updateTopicMutation, topic]
	)

	const handleDelete = useCallback(async () => {
		if (topic?.id) {
			await deleteTopic({ id: topic.id })
		}
	}, [deleteTopic, topic?.id])

	const handleArchiveToggle = useCallback(async () => {
		if (topic?.id) {
			await updateTopicMutation({
				id: topic.id,
				is_archived: !topic.is_archived
			})
		}
	}, [updateTopicMutation, topic?.id, topic?.is_archived])

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: topic?.notes ?? '',
		onSave: updateNotesMutation,
		key: `topic-dialog-${topic?.id}`
	})

	const { value: title, onChange: onNameChange } = useAutoSave({
		initialValue: topic?.name ?? '',
		onSave: updateNameMutation,
		key: `topic-dialog-name-${topic?.id}`
	})

	const titleTextareaRef = useAutoResizeTextarea(title)
	const notesRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (open && notesRef.current) {
			notesRef.current.focus()
		}
	}, [open])

	if (!topic) {
		return null
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='max-w-2xl'>
				<DialogHeader>
					<div className='flex items-center gap-2'>
						{topic.is_archived && (
							<>
								<Archive className='h-4 w-4 text-muted-foreground' />
								<span className='text-muted-foreground text-xs'>Archived</span>
							</>
						)}
					</div>
					<DialogTitle className='sr-only'>Edit Topic</DialogTitle>
					<DialogDescription className='sr-only'>
						Edit the topic name and notes, or perform other actions.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4'>
					<textarea
						className='!bg-transparent break-word flex w-full resize-none border-none font-bold text-xl focus:outline-none'
						onChange={onNameChange}
						placeholder='Title'
						ref={titleTextareaRef}
						rows={1}
						spellCheck={false}
						value={title}
					/>

					<Textarea
						className='!bg-transparent min-h-48 w-full resize-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
						name='notes'
						onChange={onNotesChange}
						placeholder='Notes'
						ref={notesRef}
						value={notes}
					/>
				</div>

				<div className='flex justify-start gap-2 pt-4'>
					<Link
						params={{ topicId: topic.id.toString() }}
						to='/topics/{-$topicId}'
					>
						<Button
							className='h-8 w-8 p-0'
							onClick={() => onOpenChange(false)}
							size='sm'
							variant='ghost'
						>
							<ExternalLink className='h-4 w-4' />
						</Button>
					</Link>

					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button className='h-8 w-8 p-0' size='sm' variant='ghost'>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='start' side='top' sideOffset={4}>
							<DropdownMenuItem onClick={handleArchiveToggle}>
								{topic.is_archived ? (
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
							<DropdownMenuItem onClick={handleDelete} variant='destructive'>
								<Trash className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</DialogContent>
		</Dialog>
	)
}
