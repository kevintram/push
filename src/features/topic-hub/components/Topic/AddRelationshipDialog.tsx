import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { FileText, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
import { useCreateRelationship } from '../../hooks/useCreateRelationship'
import { useDebouncedPotentialTopics } from '../../hooks/useDebouncedPotentialTopics'

interface AddRelationshipDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	topicId: number | undefined
	relationshipType: 'child' | 'parent'
	onRelationshipCreated?: (topic: Tables<'topics'>) => void
}

export function AddRelationshipDialog({
	open,
	onOpenChange,
	topicId,
	relationshipType,
	onRelationshipCreated
}: AddRelationshipDialogProps) {
	const [name, setName] = useState('')
	const [notes, setNotes] = useState('')
	const [sidebarOpen, setSidebarOpen] = useState(true)

	const nameTextareaRef = useAutoResizeTextarea(name)
	const notesTextareaRef = useAutoResizeTextarea(notes)

	const { setQuery, debouncedQuery, results, isLoading } =
		useDebouncedPotentialTopics({
			topicId,
			relationshipType,
			debounceMs: 300
		})

	const createRelationship = useCreateRelationship()
	const { mutateAsync: insertTopicMutation, isPending: isCreatingTopic } =
		useInsertMutation(supabase.from('topics'), ['id'], '*')

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
			setQuery('')
			setSidebarOpen(true)
		}
	}, [open, setQuery])

	// Sync notes with the hook's query for search
	useEffect(() => {
		setQuery(notes)
	}, [notes, setQuery])

	const handleTopicSelect = useCallback(
		async (topic: Tables<'topics'>) => {
			if (!topicId) return

			try {
				if (relationshipType === 'child') {
					await createRelationship.mutateAsync({
						parent: topicId,
						child: topic.id
					})
				} else {
					await createRelationship.mutateAsync({
						parent: topic.id,
						child: topicId
					})
				}

				onRelationshipCreated?.(topic)
				onOpenChange(false)
			} catch (_error) {}
		},
		[
			topicId,
			relationshipType,
			createRelationship,
			onRelationshipCreated,
			onOpenChange
		]
	)

	const handleCreateTopic = useCallback(async () => {
		if (!(topicId && name.trim())) return

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

			if (relationshipType === 'child') {
				await createRelationship.mutateAsync({
					parent: topicId,
					child: newTopic.id
				})
			} else {
				await createRelationship.mutateAsync({
					parent: newTopic.id,
					child: topicId
				})
			}

			onRelationshipCreated?.(newTopic)
			onOpenChange(false)
		} catch (_error) {}
	}, [
		topicId,
		name,
		notes,
		relationshipType,
		insertTopicMutation,
		createRelationship,
		onRelationshipCreated,
		onOpenChange
	])

	const dialogTitle =
		relationshipType === 'child' ? 'Add Child Topic' : 'Add Parent Topic'

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
								<DialogTitle>{dialogTitle}</DialogTitle>
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
									placeholder='Name'
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
									{isCreatingTopic ? 'Creating...' : 'Create New Topic'}
								</Button>
							</div>
						</div>
					</div>

					{sidebarOpen && (
						<div className='flex h-full w-2/5 flex-shrink-0 flex-col border-l bg-sidebar lg:w-1/3'>
							<div className='flex-shrink-0 p-4 pb-2'>
								<h2 className='font-medium text-lg'>
									{debouncedQuery === '' ? 'Recent' : 'Matching Topics'}
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

									{debouncedQuery && !isLoading && results.length === 0 && (
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

									{!debouncedQuery && results.length === 0 && (
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
