import {
	useDeleteMutation,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import {
	Archive,
	ArchiveRestore,
	Inbox,
	Maximize2,
	MoreHorizontal,
	Trash,
	X
} from 'lucide-react'
import { use, useCallback, useEffect, useRef } from 'react'
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
import { SidebarInset, SidebarProvider } from '~/components/ui/Sidebar'
import { Textarea } from '~/components/ui/Textarea'
import { TopicChildrenPanel } from '~/features/topic-hub/components/Topic/FamilyPanel/TopicChildrenPanel'
import { TopicParentsPanel } from '~/features/topic-hub/components/Topic/FamilyPanel/TopicParentsPanel'
import { TimelineSidebar } from '~/features/topic-hub/components/Topic/TimelineSidebar'
import { TopicContext } from '~/features/topic-hub/stores/SelectedTopicContext'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { supabase } from '~/utils/supabase'

interface TopicDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function TopicDialog({ open, onOpenChange }: TopicDialogProps) {
	const navigate = useNavigate()
	const { topic } = use(TopicContext)

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

	const handleInboxToggle = useCallback(async () => {
		if (topic?.id) {
			await updateTopicMutation({
				id: topic.id,
				is_inboxed: !topic.is_inboxed
			})
		}
	}, [updateTopicMutation, topic?.id, topic?.is_inboxed])

	const handleNavigate = useCallback(() => {
		if (topic?.id) {
			navigate({
				to: '/topics/{-$topicId}',
				params: { topicId: topic.id.toString() }
			})
			onOpenChange(false)
		}
	}, [topic?.id, navigate, onOpenChange])

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
			<DialogContent
				className='h-full w-full p-0 md:max-h-[600px] md:max-w-[800px] lg:max-w-[900px] xl:max-w-[1100px] 2xl:max-w-[1200px]'
				showCloseButton={false}
			>
				<SidebarProvider defaultOpen={true}>
					<SidebarInset className='overflow-y-auto p-6'>
						<DialogHeader>
							<div className='absolute top-2 left-2 p-2'>
								{topic.is_archived && (
									<div className='flex items-center gap-2'>
										<Archive className='h-4 w-4 text-muted-foreground' />
										<span className='text-muted-foreground text-xs'>
											Archived
										</span>
									</div>
								)}
								{topic.is_inboxed && (
									<div className='flex items-center gap-2'>
										<Inbox className='h-4 w-4 text-muted-foreground' />
										<span className='text-muted-foreground text-xs'>Inbox</span>
									</div>
								)}
							</div>
							<div className='absolute top-2 right-2'>
								<Button
									className='h-8 w-8 p-0 text-muted-foreground'
									onClick={handleNavigate}
									size='sm'
									variant='ghost'
								>
									<Maximize2 className='h-4 w-4' />
								</Button>

								<DropdownMenu>
									<DropdownMenuTrigger asChild={true}>
										<Button
											className='h-8 w-8 p-0 text-muted-foreground'
											size='sm'
											variant='ghost'
										>
											<MoreHorizontal className='h-4 w-4' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' side='bottom' sideOffset={4}>
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
										<DropdownMenuItem onClick={handleInboxToggle}>
											{topic.is_inboxed ? (
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
										<DropdownMenuItem
											onClick={handleDelete}
											variant='destructive'
										>
											<Trash className='mr-2 h-4 w-4' />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>

								<Button
									className='h-8 w-8 p-0 text-muted-foreground'
									onClick={() => onOpenChange(false)}
									size='sm'
									variant='ghost'
								>
									<X className='h-4 w-4' />
								</Button>
							</div>

							<DialogTitle className='sr-only'>Edit Topic</DialogTitle>
							<DialogDescription className='sr-only'>
								Edit the topic name and notes, or perform other actions.
							</DialogDescription>
						</DialogHeader>

						<div className='space-y-4 pt-6'>
							<TopicParentsPanel />

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

							<TopicChildrenPanel />
						</div>
					</SidebarInset>
					<TimelineSidebar />
				</SidebarProvider>
			</DialogContent>
		</Dialog>
	)
}
