import {
	useDeleteMutation,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import {
	Archive,
	ArchiveRestore,
	Inbox,
	MoreVertical,
	Trash
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { SidebarProvider } from '~/components/ui/Sidebar'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { useTopicWithRelationships } from '../../hooks/useTopicWithRelationships'
import { TopicContext } from '../../stores/SelectedTopicContext'
import { TopicDialog } from '../TopicDialog'
import { TopicChildrenPanel } from './FamilyPanel/TopicChildrenPanel'
import { TopicParentsPanel } from './FamilyPanel/TopicParentsPanel'
import { TimelineSidebar } from './TimelineSidebar'
import { TopicPageSkeleton } from './TopicPageSkeleton'

export function TopicPage({ topicId }: { topicId: number | undefined }) {
	const { topic: selectedTopic, isLoading } = useTopicWithRelationships(topicId)
	const navigate = useNavigate()
	const [dialogTopic, setDialogTopic] = useState<Topic | null>(null)
	const [showDialog, setShowDialog] = useState(false)

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
				navigate({
					to: '/topics/{-$topicId}',
					params: { topicId: undefined }
				})
			}
		}
	)

	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (selectedTopic?.id) {
				updateTopicMutation({ id: selectedTopic.id, notes: newNotes })
			}
		},
		[updateTopicMutation, selectedTopic?.id]
	)

	const updateNameMutation = useCallback(
		(newTitle: string) => {
			if (!selectedTopic) return
			updateTopicMutation({ id: selectedTopic.id, name: newTitle })
		},
		[updateTopicMutation, selectedTopic]
	)

	const handleDelete = useCallback(async () => {
		if (selectedTopic?.id) {
			await deleteTopic({ id: selectedTopic.id })
		}
	}, [deleteTopic, selectedTopic?.id])

	const handleArchiveToggle = useCallback(async () => {
		if (selectedTopic?.id) {
			await updateTopicMutation({
				id: selectedTopic.id,
				is_archived: !selectedTopic.is_archived
			})
		}
	}, [updateTopicMutation, selectedTopic?.id, selectedTopic?.is_archived])

	const handleInboxToggle = useCallback(async () => {
		if (selectedTopic?.id) {
			await updateTopicMutation({
				id: selectedTopic.id,
				is_inboxed: !selectedTopic.is_inboxed
			})
		}
	}, [updateTopicMutation, selectedTopic?.id, selectedTopic?.is_inboxed])

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: selectedTopic?.notes ?? '',
		onSave: updateNotesMutation,
		key: `topics-${selectedTopic?.id}`
	})

	const { value: title, onChange: onNameChange } = useAutoSave({
		initialValue: selectedTopic?.name ?? '',
		onSave: updateNameMutation,
		key: `topics-${selectedTopic?.id}`
	})

	const textareaRef = useAutoResizeTextarea(title)

	const notesRef = useRef<HTMLTextAreaElement>(null)

	// focus on notes whenever selected topic changes
	useEffect(() => {
		if (notesRef.current) {
			notesRef.current.focus()
		}
	}, [selectedTopic?.id])

	const handleTopicDialogOpen = useCallback((topic: Topic) => {
		setDialogTopic(topic)
		setShowDialog(true)
	}, [])

	const pageContextValue = useMemo(
		() => ({
			topic: selectedTopic,
			onTopicChange: handleTopicDialogOpen
		}),
		[selectedTopic, handleTopicDialogOpen]
	)

	const dialogContextValue = useMemo(
		() => ({
			topic: dialogTopic ?? undefined,
			onTopicChange: handleTopicDialogOpen
		}),
		[dialogTopic, handleTopicDialogOpen]
	)

	if (isLoading || !selectedTopic) {
		return <TopicPageSkeleton />
	}

	return (
		<div className='flex h-screen w-full'>
			<TopicContext value={pageContextValue}>
				<SidebarProvider defaultOpen={true}>
					<div className='mx-auto flex h-full w-full max-w-screen-lg flex-1'>
						<div className='flex flex-1 flex-col items-center gap-4 sm:gap-6 sm:p-4 md:p-6'>
							<div className='w-full'>
								<TopicParentsPanel />
							</div>

							<Card className='w-full gap-0 pt-4'>
								<CardHeader className='flex flex-col gap-1 pr-4'>
									<div className='flex w-full flex-row'>
										<div className='flex flex-1 items-center gap-4'>
											{selectedTopic?.is_archived && (
												<div className='flex items-center'>
													<Archive className='mr-2 h-4 w-4 text-muted-foreground' />
													<span className='text-muted-foreground text-xs'>
														Archived
													</span>
												</div>
											)}
											{selectedTopic?.is_inboxed && (
												<div className='flex items-center'>
													<Inbox className='mr-2 h-4 w-4 text-muted-foreground' />
													<span className='text-muted-foreground text-xs'>
														Inbox
													</span>
												</div>
											)}
										</div>

										<div className='flex justify-end'>
											<DropdownMenu>
												<DropdownMenuTrigger asChild={true}>
													<Button
														className='h-6 w-6 p-0'
														size='sm'
														title='More options'
														variant='ghost'
													>
														<MoreVertical className='h-4 w-4' />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent>
													<DropdownMenuItem onClick={handleArchiveToggle}>
														{selectedTopic?.is_archived ? (
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
														{selectedTopic?.is_inboxed ? (
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
										</div>
									</div>

									<textarea
										className='!bg-transparent break-word flex w-full resize-none border-none font-bold text-xl focus:outline-none sm:flex-1 sm:pr-4 sm:text-2xl md:text-3xl'
										onChange={onNameChange}
										placeholder='Title'
										ref={textareaRef}
										rows={1}
										spellCheck={false}
										value={title}
									/>
								</CardHeader>
								<CardContent className='min-h-96 px-4'>
									<Textarea
										className='!bg-transparent h-full w-full resize-none border-none shadow-none focus-visible:border-none focus-visible:ring-0'
										name='notes'
										onChange={onNotesChange}
										placeholder='Notes'
										ref={notesRef}
										value={notes}
									/>
								</CardContent>
							</Card>

							<div className='w-full'>
								<TopicChildrenPanel />
							</div>
						</div>
					</div>
					<TimelineSidebar />
				</SidebarProvider>

				<TopicContext value={dialogContextValue}>
					<TopicDialog onOpenChange={setShowDialog} open={showDialog} />
				</TopicContext>
			</TopicContext>
		</div>
	)
}
