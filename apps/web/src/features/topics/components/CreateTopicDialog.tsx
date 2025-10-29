import { FileText, PanelRightClose, PanelRightOpen } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '~/components/ui/Dialog'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import type { Tables } from '~/types/database.types'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { useCreateTopic } from '../api/useCreateTopic'
import { TopicComposerFields } from './TopicComposerFields'

interface SearchResult {
	results: Array<Tables<'topics'>>
	isLoading: boolean
	debouncedQuery: string
}

interface CreateTopicDialogProps {
	open?: boolean
	onOpenChange?: (open: boolean) => void
	trigger?: ReactNode
	title: string
	submitButtonText?: string
	showSidebar?: boolean
	topicDefaults?: Partial<Tables<'topics'>>
	onTopicCreated?: (topic: Tables<'topics'>) => Promise<void> | void
	useSearch?: (query: string) => SearchResult
	sidebarTitle?: (debouncedQuery: string) => string
}

export function CreateTopicDialog({
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	trigger,
	title,
	submitButtonText = 'Create Topic',
	showSidebar = false,
	topicDefaults = {},
	onTopicCreated,
	useSearch,
	sidebarTitle = query => (query === '' ? 'Recent Topics' : 'Matching Topics')
}: CreateTopicDialogProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
	const [name, setName] = useState('')
	const [notes, setNotes] = useState('')
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')

	const nameTextareaRef = useAutoResizeTextarea(name)
	const notesTextareaRef = useAutoResizeTextarea(notes)

	// Use controlled or uncontrolled state
	const isControlled = controlledOpen !== undefined
	const open = isControlled ? controlledOpen : uncontrolledOpen
	const setOpen = isControlled
		? controlledOnOpenChange || (() => {})
		: setUncontrolledOpen

	// Search results (only if sidebar is enabled and search hook provided)
	const searchResults = useSearch?.(searchQuery)

	const canCreateTopic = Boolean(name.trim() || notes.trim())

	const { mutateAsync: insertTopic, isPending: isCreatingTopic } =
		useCreateTopic()

	// Focus notes input when dialog opens
	useEffect(() => {
		if (open) {
			setTimeout(() => {
				notesTextareaRef.current?.focus()
			}, 0)
		}
	}, [open, notesTextareaRef])

	// Reset state when dialog opens/closes
	useEffect(() => {
		if (open) {
			setName('')
			setNotes('')
			setSearchQuery('')
			setSidebarOpen(true)
		}
	}, [open])

	// Sync form input with the search query
	useEffect(() => {
		if (showSidebar) {
			const trimmedNotes = notes.trim()
			const trimmedName = name.trim()
			setSearchQuery(trimmedNotes || trimmedName)
		}
	}, [notes, name, showSidebar])

	const handleTopicSelect = useCallback(
		async (topic: Tables<'topics'>) => {
			if (onTopicCreated) {
				await onTopicCreated(topic)
			}
			setOpen(false)
		},
		[onTopicCreated, setOpen]
	)

	const handleCreateTopic = useCallback(async () => {
		const trimmedName = name.trim()
		const trimmedNotes = notes.trim()

		if (!(trimmedName || trimmedNotes)) return

		try {
			const newTopic = await insertTopic({
				name: trimmedName || '',
				notes: trimmedNotes || '',
				...topicDefaults
			})

			if (onTopicCreated) {
				await onTopicCreated(newTopic as any)
			}

			setOpen(false)
		} catch (_error) {
			// Error handling could be added here if needed
		}
	}, [name, notes, topicDefaults, insertTopic, onTopicCreated, setOpen])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		await handleCreateTopic()
	}

	const dialogContent = (
		<DialogContent
			className={
				showSidebar
					? '!max-w-[1100px] h-[600px] max-h-[90vh] w-[95vw] p-0'
					: 'p-0 sm:max-w-[600px]'
			}
			showCloseButton={!showSidebar}
		>
			<div
				className={
					showSidebar ? 'flex h-full overflow-hidden' : 'flex flex-col'
				}
			>
				<div
					className={
						showSidebar ? 'flex min-w-0 flex-[2] flex-col' : 'flex flex-col'
					}
				>
					<DialogHeader className='flex-shrink-0 border-b px-6 pt-6 pb-4'>
						{showSidebar ? (
							<div className='flex items-center justify-between'>
								<DialogTitle>{title}</DialogTitle>
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
						) : (
							<DialogTitle>{title}</DialogTitle>
						)}
					</DialogHeader>
					<form className='flex flex-1 flex-col' onSubmit={handleSubmit}>
						<div className='flex-1 overflow-y-auto px-6 py-4'>
							<TopicComposerFields
								name={name}
								namePlaceholder='Name'
								nameRef={nameTextareaRef}
								notes={notes}
								notesPlaceholder='Notes'
								notesRef={notesTextareaRef}
								onNameChange={setName}
								onNotesChange={setNotes}
							/>
						</div>
						<div className='flex-shrink-0 border-t px-6 py-4'>
							<div className='flex justify-between'>
								<Button
									onClick={() => setOpen(false)}
									type='button'
									variant='outline'
								>
									Cancel
								</Button>
								<Button
									disabled={!canCreateTopic || isCreatingTopic}
									type='submit'
								>
									{isCreatingTopic ? 'Creating...' : submitButtonText}
								</Button>
							</div>
						</div>
					</form>
				</div>

				{showSidebar && sidebarOpen && searchResults && (
					<div className='flex h-full w-2/5 flex-shrink-0 flex-col border-l bg-sidebar lg:w-1/3'>
						<div className='flex-shrink-0 p-4 pb-2'>
							<h2 className='font-medium text-lg'>
								{sidebarTitle(searchResults.debouncedQuery)}
							</h2>
						</div>
						<div className='flex-1 overflow-y-auto px-4 pb-4'>
							<div className='space-y-2'>
								{searchResults.isLoading && searchResults.debouncedQuery && (
									<div className='flex items-center justify-center py-4 text-muted-foreground text-sm'>
										<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
										Searching...
									</div>
								)}

								{searchResults.debouncedQuery &&
									!searchResults.isLoading &&
									searchResults.results.length === 0 && (
										<div className='py-4 text-center text-muted-foreground text-sm'>
											No topics found for "{searchResults.debouncedQuery}"
										</div>
									)}

								{searchResults.results.length > 0 && (
									<div className='space-y-2'>
										{searchResults.results.map(topic => (
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
																	query: searchResults.debouncedQuery
																})}
															</div>
															{topic.notes && (
																<div className='mt-1 line-clamp-2 text-muted-foreground text-xs'>
																	{truncateWithHighlight(
																		topic.notes,
																		searchResults.debouncedQuery,
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

								{!searchResults.debouncedQuery &&
									searchResults.results.length === 0 && (
										<div className='py-4 text-center text-muted-foreground text-sm'>
											Start typing to search for available topics
										</div>
									)}
							</div>
						</div>
					</div>
				)}
			</div>
		</DialogContent>
	)

	// If trigger provided, wrap in Dialog with trigger
	if (trigger) {
		return (
			<Dialog onOpenChange={setOpen} open={open}>
				<DialogTrigger asChild={true}>{trigger}</DialogTrigger>
				{dialogContent}
			</Dialog>
		)
	}

	// Otherwise, return controlled dialog without trigger
	return (
		<Dialog onOpenChange={setOpen} open={open}>
			{dialogContent}
		</Dialog>
	)
}
