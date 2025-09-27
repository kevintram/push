import {
	useInsertMutation,
	useQuery,
	useRevalidateTables
} from '@supabase-cache-helpers/postgrest-react-query'
import debounce from 'lodash.debounce'
import { FileText, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'

interface AddTopicToTodoDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	todoId: number | undefined
}

export function AddTopicToTodoDialog({
	open,
	onOpenChange,
	todoId
}: AddTopicToTodoDialogProps) {
	const [name, setName] = useState('')
	const [notes, setNotes] = useState('')
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')

	const nameTextareaRef = useAutoResizeTextarea(name)
	const notesTextareaRef = useAutoResizeTextarea(notes)

	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'todos' },
		{ schema: 'public', table: 'todos_topics' }
	])

	// Debounced search query
	const updateDebouncedQuery = useCallback(
		debounce((term: string) => setDebouncedQuery(term), 300),
		[]
	)

	useEffect(() => {
		updateDebouncedQuery(searchQuery)
	}, [searchQuery, updateDebouncedQuery])

	// Search topics
	const { data: topics = [], isLoading } = useQuery(
		supabase
			.from('topics')
			.select('*')
			.or(
				debouncedQuery
					? `name.ilike.%${debouncedQuery}%,notes.ilike.%${debouncedQuery}%`
					: ''
			)
			.order('updated_at', { ascending: false })
			.limit(20),
		{
			enabled: open
		}
	)

	const results = useMemo(() => {
		if (!debouncedQuery) {
			return topics?.slice(0, 10) ?? [] // Show recent topics when no search
		}
		return topics ?? []
	}, [topics, debouncedQuery])

	const { mutateAsync: insertTopicMutation, isPending: isCreatingTopic } =
		useInsertMutation(supabase.from('topics'), ['id'], '*')

	const { mutateAsync: insertTodoTopicMutation } = useInsertMutation(
		supabase.from('todos_topics'),
		['topic_id', 'todo_id'],
		'*',
		{
			onSuccess: () => {
				revalidateTables()
			}
		}
	)

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

	// Sync notes with the search query
	useEffect(() => {
		setSearchQuery(notes)
	}, [notes])

	const handleTopicSelect = useCallback(
		async (topic: Tables<'topics'>) => {
			if (!todoId) return

			try {
				await insertTodoTopicMutation([
					{
						topic_id: topic.id,
						todo_id: todoId
					}
				])
				onOpenChange(false)
			} catch (_error) {
				// Handle error silently for now
			}
		},
		[todoId, insertTodoTopicMutation, onOpenChange]
	)

	const handleCreateTopic = useCallback(async () => {
		if (!(todoId && name.trim())) return

		try {
			const createdTopic = await insertTopicMutation([
				{
					name: name.trim(),
					notes: notes.trim()
				}
			])

			if (!createdTopic?.[0]) {
				throw new Error('Failed to create topic')
			}

			const newTopic = createdTopic[0]

			// Create the todo-topic relationship
			await insertTodoTopicMutation([
				{
					topic_id: newTopic.id,
					todo_id: todoId
				}
			])

			onOpenChange(false)
		} catch (_error) {
			// Handle error silently for now
		}
	}, [
		todoId,
		name,
		notes,
		insertTopicMutation,
		insertTodoTopicMutation,
		onOpenChange
	])

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='!max-w-[1100px] h-[600px] max-h-[90vh] w-[95vw] p-0'
				showCloseButton={false}
			>
				<div className='flex h-full overflow-hidden'>
					<div className='flex min-w-0 flex-[2] flex-col'>
						<DialogHeader className='flex-shrink-0 border-b px-6 pt-6 pb-4'>
							<div className='flex items-center justify-between'>
								<DialogTitle>Add Topic to Todo</DialogTitle>
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
									onChange={e => setName(e.target.value)}
									placeholder='Topic Name'
									ref={nameTextareaRef}
									rows={1}
									spellCheck={false}
									value={name}
								/>

								<Textarea
									className='!bg-transparent min-h-48 w-full resize-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
									onChange={e => setNotes(e.target.value)}
									placeholder='Notes'
									ref={notesTextareaRef}
									value={notes}
								/>
							</div>
						</div>

						<div className='flex-shrink-0 border-t px-6 py-4'>
							<div className='flex justify-between'>
								<Button onClick={() => onOpenChange(false)} variant='outline'>
									Cancel
								</Button>
								<Button
									disabled={!name.trim() || isCreatingTopic}
									onClick={handleCreateTopic}
								>
									{isCreatingTopic ? 'Creating...' : 'Create & Add Topic'}
								</Button>
							</div>
						</div>
					</div>

					{sidebarOpen && (
						<div className='flex h-full w-2/5 flex-shrink-0 flex-col border-l bg-sidebar lg:w-1/3'>
							<div className='flex-shrink-0 p-4 pb-2'>
								<h2 className='font-medium text-lg'>
									{debouncedQuery === '' ? 'Recent Topics' : 'Matching Topics'}
								</h2>
							</div>
							<div className='flex-1 overflow-y-auto px-4 pb-4'>
								<div className='space-y-2'>
									{isLoading && debouncedQuery && (
										<div className='flex items-center justify-center py-4 text-muted-foreground text-sm'>
											<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
											Searching...
										</div>
									)}

									{debouncedQuery &&
										!isLoading &&
										(results?.length ?? 0) === 0 && (
											<div className='py-4 text-center text-muted-foreground text-sm'>
												No topics found for "{debouncedQuery}"
											</div>
										)}

									{(results?.length ?? 0) > 0 && (
										<div className='space-y-2'>
											{results?.map((topic: Tables<'topics'>) => (
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

									{!debouncedQuery && (results?.length ?? 0) === 0 && (
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
		</Dialog>
	)
}
