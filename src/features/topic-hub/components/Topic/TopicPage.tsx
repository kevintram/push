import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import {
	ArchiveRestore,
	Baby,
	ChevronDown,
	Info,
	RotateCcw,
	Sprout,
	Star,
	UserPlus,
	Users
} from 'lucide-react'
import { use, useCallback, useEffect, useMemo, useRef } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Progress } from '~/components/ui/Progress'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { cn } from '~/lib/utils'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../stores/SelectedTopicContext'
import { numDaysElapsedFrom } from '../../utils/daysElapsed'
import { getRetrievabilityColorClass } from '../../utils/getRetrievabilityColor'
import { TopicChildrenPanel } from './FamilyPanel/TopicChildrenPanel'
import { TopicParentsPanel } from './FamilyPanel/TopicParentsPanel'
import { TopicPageSkeleton } from './TopicPageSkeleton'

export function TopicPage({ isLoading }: { isLoading: boolean }) {
	const { selectedTopic } = use(TopicHubContext)

	const { mutateAsync: updateTopicMutation } = useUpdateMutation(
		supabase.from('topics'),
		['id'],
		'*'
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

	const sinceLastReview = useMemo(
		() =>
			selectedTopic
				? numDaysElapsedFrom(new Date(selectedTopic.inserted_at))
				: 0,
		[selectedTopic]
	)

	const notesRef = useRef<HTMLTextAreaElement>(null)

	// focus on notes whenever selected topic changes
	useEffect(() => {
		if (notesRef.current) {
			notesRef.current.focus()
		}
	}, [selectedTopic?.id])

	if (isLoading) {
		return <TopicPageSkeleton />
	}

	return (
		<div className='!pt-0 flex flex-1 flex-col items-center gap-4 sm:gap-6 sm:p-4 md:p-6'>
			<div className='w-full'>
				<TopicParentsPanel />
			</div>

			<Card className='w-full gap-0'>
				<CardHeader className='gap-4'>
					<div className='flex w-full justify-end gap-2'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild={true}>
								<Button size='sm' variant='secondary'>
									<Baby className='h-4 w-4' />
									<span className='ml-1'>Populate</span>
									<ChevronDown className='ml-1 h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem>
									<Users className='h-4 w-4' />
									Children
								</DropdownMenuItem>
								<DropdownMenuItem>
									<UserPlus className='h-4 w-4' />
									Grandchildren
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Star className='h-4 w-4' />
									All Descendants
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<DropdownMenu>
							<DropdownMenuTrigger asChild={true}>
								<Button size='sm' variant='ghost'>
									<Info className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='w-64'>
								{/* Retrievability */}
								<div className='flex items-center gap-3 p-2'>
									<ArchiveRestore className='h-4 w-4 text-muted-foreground' />
									<div className='flex-1'>
										<p className='font-medium text-sm'>Retrievability</p>
										<p className='text-muted-foreground text-xs'>
											<span
												className={cn(
													getRetrievabilityColorClass(
														selectedTopic.retrievability
													)
												)}
											>
												{(selectedTopic.retrievability * 100).toFixed(0)}%
											</span>
										</p>
									</div>
								</div>

								{/* Last Reviewed */}
								<div className='flex items-center gap-3 p-2'>
									<RotateCcw className='h-4 w-4 text-muted-foreground' />
									<div className='flex-1'>
										<p className='font-medium text-sm'>Last Reviewed</p>
										<p className='text-muted-foreground text-xs'>
											{sinceLastReview} days ago
										</p>
									</div>
								</div>

								{/* Stability */}
								<div className='flex items-center gap-3 p-2'>
									<div className='flex flex-col items-center gap-1'>
										<Progress
											className='h-1.5 w-8'
											max={365}
											value={selectedTopic.stability}
										/>
									</div>
									<div className='flex-1'>
										<p className='font-medium text-sm'>Stability</p>
										<p className='text-muted-foreground text-xs'>
											{selectedTopic.stability}/365 days
										</p>
									</div>
								</div>

								{/* Born */}
								<div className='flex items-center gap-3 p-2'>
									<Sprout className='h-4 w-4 text-muted-foreground' />
									<div className='flex-1'>
										<p className='font-medium text-sm'>Born</p>
										<p className='text-muted-foreground text-xs'>
											{sinceLastReview} days ago
										</p>
									</div>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className='flex w-full'>
						<textarea
							className='break-word w-full resize-none border-none bg-transparent font-bold text-xl focus:outline-none sm:flex-1 sm:pr-4 sm:text-2xl md:text-3xl'
							onChange={onNameChange}
							placeholder='Title'
							ref={textareaRef}
							rows={1}
							spellCheck={false}
							value={title}
						/>
					</div>
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
	)
}
