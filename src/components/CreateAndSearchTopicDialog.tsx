import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { FileText, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useGlobalSearch } from '~/hooks/useGlobalSearch'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog'
import { Textarea } from './ui/Textarea'

interface CreateAndSearchTopicDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onTopicCreated?: (topic: Tables<'topics'>) => void
}

export function CreateAndSearchTopicDialog({
	open,
	onOpenChange,
	onTopicCreated
}: CreateAndSearchTopicDialogProps) {
	const [title, setTitle] = useState('')
	const [notes, setNotes] = useState('')
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [showConfirmClose, setShowConfirmClose] = useState(false)

	const titleTextareaRef = useAutoResizeTextarea(title)
	const notesRef = useRef<HTMLTextAreaElement>(null)

	// Combine title and notes for search
	const searchQuery = `${title} ${notes}`.trim()
	const { debouncedQuery, results, isLoading } = useGlobalSearch(searchQuery)

	const { mutateAsync: insertTopicMutation, isPending } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	// Focus title input when dialog opens
	useEffect(() => {
		if (open) {
			setTimeout(() => {
				titleTextareaRef.current?.focus()
			}, 0)
		}
	}, [open, titleTextareaRef])

	// Reset state when dialog opens/closes
	useEffect(() => {
		if (open) {
			setTitle('')
			setNotes('')
			setSidebarOpen(true)
			setShowConfirmClose(false)
		}
	}, [open])

	const hasUnsavedChanges = title.trim() || notes.trim()

	const handleClose = () => {
		if (hasUnsavedChanges && !showConfirmClose) {
			setShowConfirmClose(true)
		} else {
			onOpenChange(false)
			setShowConfirmClose(false)
		}
	}

	const handleConfirmClose = () => {
		onOpenChange(false)
		setShowConfirmClose(false)
	}

	const handleCancelClose = () => {
		setShowConfirmClose(false)
	}

	const handleTopicSelect = (topic: Tables<'topics'>) => {
		setTitle(topic.name || '')
		setNotes(topic.notes || '')
		setSidebarOpen(false)
		onTopicCreated?.(topic)
		onOpenChange(false)
	}

	const handleCreateTopic = async () => {
		if (!(title.trim() || notes.trim())) return

		try {
			const createdTopic = await insertTopicMutation([
				{
					name: title.trim(),
					notes: notes.trim()
				}
			])

			if (createdTopic?.[0]) {
				onTopicCreated?.(createdTopic[0])
				onOpenChange(false)
			}
		} catch (_error) {}
	}

	if (showConfirmClose) {
		return (
			<Dialog
				onOpenChange={() => setShowConfirmClose(false)}
				open={showConfirmClose}
			>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Discard changes?</DialogTitle>
					</DialogHeader>
					<div className='py-4'>
						<p className='text-muted-foreground text-sm'>
							You have unsaved changes. Are you sure you want to close without
							saving?
						</p>
					</div>
					<div className='flex justify-end space-x-2'>
						<Button onClick={handleCancelClose} variant='outline'>
							Cancel
						</Button>
						<Button onClick={handleConfirmClose} variant='destructive'>
							Discard
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Dialog onOpenChange={handleClose} open={open}>
			<DialogContent
				className='!max-w-[1100px] h-[600px] max-h-[90vh] w-[95vw] p-0'
				showCloseButton={false}
			>
				<div className='flex h-full overflow-hidden'>
					<div className='flex min-w-0 flex-[2] flex-col'>
						<DialogHeader className='flex-shrink-0 border-b px-6 pt-6 pb-4'>
							<div className='flex items-center justify-between'>
								<DialogTitle>Create New Topic</DialogTitle>
								<Button
									onClick={() => setSidebarOpen(!sidebarOpen)}
									size='icon'
									variant='ghost'
								>
									{sidebarOpen ? (
										<PanelRightClose className='h-4 w-4' />
									) : (
										<PanelRightOpen className='h-4 w-4' />
									)}
								</Button>
							</div>
						</DialogHeader>

						<div className='flex-1 overflow-y-auto px-6 py-4'>
							<div className='space-y-4'>
								<textarea
									className='!bg-transparent break-word flex w-full resize-none border-none font-bold text-xl focus:outline-none'
									onChange={e => setTitle(e.target.value)}
									placeholder='Title'
									ref={titleTextareaRef}
									rows={1}
									spellCheck={false}
									value={title}
								/>

								<Textarea
									className='!bg-transparent min-h-48 w-full resize-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
									name='notes'
									onChange={e => setNotes(e.target.value)}
									placeholder='Notes'
									ref={notesRef}
									value={notes}
								/>
							</div>
						</div>

						<div className='flex-shrink-0 border-t px-6 py-4'>
							<div className='flex justify-end'>
								<Button
									disabled={!(title.trim() || notes.trim()) || isPending}
									onClick={handleCreateTopic}
								>
									{isPending ? 'Creating...' : 'Create New Topic'}
								</Button>
							</div>
						</div>
					</div>

					{sidebarOpen && (
						<div className='flex h-full w-2/5 flex-shrink-0 flex-col border-l bg-sidebar lg:w-1/3'>
							<div className='flex-shrink-0 p-4 pb-2'>
								<h2 className='font-medium text-lg'>
									{searchQuery === '' ? 'Recent' : 'Matching'}
								</h2>
							</div>
							<div className='flex-1 overflow-y-auto px-4 pb-4'>
								<div className='space-y-2'>
									{isLoading && searchQuery && (
										<div className='flex items-center justify-center py-4 text-muted-foreground text-sm'>
											<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
											Searching...
										</div>
									)}

									{searchQuery && !isLoading && results.length === 0 && (
										<div className='py-4 text-center text-muted-foreground text-sm'>
											No topics found for "{debouncedQuery}"
										</div>
									)}

									{results.length > 0 && (
										<div className='space-y-2'>
											{results.map(topic => (
												<Card
													className='cursor-pointer p-3 transition-colors hover:bg-accent'
													key={topic.id}
													onClick={() => handleTopicSelect(topic)}
												>
													<CardContent className='p-0'>
														<div className='flex items-start gap-2'>
															<FileText className='mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground' />
															<div className='min-w-0 flex-1'>
																<div className='line-clamp-1 font-medium text-sm'>
																	{highlightText({
																		text: topic.name || 'Untitled',
																		query: debouncedQuery
																	})}
																</div>
																{topic.notes && (
																	<div className='mt-1 line-clamp-2 text-muted-foreground text-xs'>
																		{truncateWithHighlight(
																			topic.notes,
																			debouncedQuery,
																			80
																		)}
																	</div>
																)}
															</div>
														</div>
													</CardContent>
												</Card>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
