import {
	useInsertMutation,
	useQuery
} from '@supabase-cache-helpers/postgrest-react-query'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { Calendar } from '~/components/ui/Calendar'
import { Input } from '~/components/ui/Input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { Textarea } from '~/components/ui/Textarea'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'
import { numDaysElapsed } from '../utils/daysElapsed'
import { getEffectiveDate } from '../utils/timeline'

export function TimelineSidebar() {
	const { selectedTopic } = use(SelectedTopicContext)

	const { data: timelineEntries } = useQuery<Array<Tables<'timeline_entries'>>>(
		supabase
			.from('timeline_entries')
			.select('*')
			.eq('topic_id', selectedTopic?.id ?? '')
			.order('scheduled_at', { ascending: true }),
		{
			enabled: selectedTopic !== undefined
		}
	)

	return (
		<div className='flex h-full flex-col gap-3 p-4'>
			<div className='flex items-center justify-between gap-2 border-b pb-2'>
				<h1 className='font-semibold'>Timeline</h1>
				<AddEntryButton />
			</div>

			<div className='flex min-h-0 flex-1 flex-col'>
				<div className='flex-1 space-y-4 overflow-auto'>
					{timelineEntries?.map((entry, index) => (
						<Entry
							currEntry={entry}
							index={index}
							key={entry.id}
							nextEntry={
								index < timelineEntries.length - 1
									? timelineEntries[index + 1]
									: undefined
							}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

function Entry({
	currEntry,
	index,
	nextEntry
}: {
	currEntry: Tables<'timeline_entries'>
	index: number
	nextEntry: Tables<'timeline_entries'> | undefined // undefined if last entry
}) {
	// TODO: Implement count based on timeline_entry_practice_cards
	// const reviewedItemsCount = 0

	// TODO: Implement stability change and retrievability with SRS logic
	// const stabilityChange = currEntry.stability_change
	// const retrievability = currEntry.retrievability

	return (
		<div className='relative flex gap-3'>
			<div className='flex flex-col items-center'>
				<div className='flex items-center gap-2'>
					<div className='font-medium text-muted-foreground text-xs'>
						{index + 1}
					</div>

					<Badge variant='default'>
						{getEffectiveDate(currEntry).toLocaleDateString()}
					</Badge>
				</div>

				{nextEntry && (
					<>
						<div className='mt-2 min-h-12 w-px flex-1 bg-border' />
						<div className='font-medium text-muted-foreground text-xs'>
							{numDaysElapsed(
								getEffectiveDate(currEntry),
								getEffectiveDate(nextEntry)
							)}
							d
						</div>
					</>
				)}
			</div>

			<div className='flex-1 py-1'>
				<div className='text-foreground text-xs'>{currEntry.description}</div>
			</div>

			{/* TODO: Implement practice cards, stability change, and retrievability later*/}
			{/* <div className='flex-1 pb-6'>
				<div className='mb-3'>
					<div className='mb-2 flex items-center gap-2'>
						<Progress className='flex-1' value={currEntry.stability} />
						<span className='font-medium text-muted-foreground text-xs'>
							{currEntry.stability} days
						</span>
					</div>

					<div className='flex items-center gap-2'>
						<div className='flex items-center gap-1 text-muted-foreground text-xs'>
							<ArchiveRestore className='h-3 w-3' />
							<span>{(retrievability * 100).toFixed(0)}%</span>
						</div>
					</div>
				</div>

				<div className='space-y-2'>
					<div className='text-foreground text-xs'>
						{reviewedItemsCount} card{reviewedItemsCount !== 1 ? 's' : ''}{' '}
						reviewed
					</div>

					<div className='flex items-center justify-between'>
						{stabilityChange !== 0 && (
							<div
								className={`font-medium text-xs ${
									stabilityChange > 0 ? 'text-green-600' : 'text-red-600'
								}`}
							>
								{stabilityChange > 0 ? '+' : ''}
								{stabilityChange}d stability
							</div>
						)}
					</div>
				</div>
			</div> */}
		</div>
	)
}

function AddEntryButton() {
	// TODO: make this not dependent on selectedTopic
	const { selectedTopic } = use(SelectedTopicContext)
	const [isOpen, setIsOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [description, setDescription] = useState('')

	const { mutateAsync: insertTimelineEntryMutation } = useInsertMutation(
		supabase.from('timeline_entries'),
		['id'],
		'*'
	)

	const handleSave = useCallback(() => {
		if (!selectedTopic) return

		setIsOpen(false)

		// reset to default values after saving
		setDescription('')
		setSelectedDate(new Date())

		insertTimelineEntryMutation([
			{
				description: description.trim(),
				scheduled_at: selectedDate.toISOString(),
				topic_id: selectedTopic.id
			}
		])
	}, [selectedTopic, selectedDate, description, insertTimelineEntryMutation])

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild={true}>
				<Button size='sm' variant='outline'>
					<Plus className='h-4 w-4' />
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-80 p-6'>
				<div className='flex w-full flex-col items-start gap-6'>
					<div className='flex w-full flex-col items-start gap-4'>
						<div className='flex w-full flex-col items-center gap-2'>
							<Calendar
								mode='single'
								onSelect={setSelectedDate}
								required={true}
								selected={selectedDate}
							/>
							<div className='relative w-full'>
								<CalendarIcon className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
								<Input
									className='pl-10'
									placeholder='Tuesday, March 26th 2024'
									readOnly={true}
									value={
										selectedDate
											? selectedDate.toLocaleDateString('en-US', {
													weekday: 'long',
													year: 'numeric',
													month: 'long',
													day: 'numeric'
												})
											: ''
									}
								/>
							</div>
						</div>
						<Textarea
							className='min-h-[144px] w-full resize-none'
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
								setDescription(e.target.value)
							}
							placeholder='Description...'
							value={description}
						/>
					</div>
					<div className='flex w-full items-center justify-end gap-2'>
						<Button disabled={!selectedTopic} onClick={handleSave}>
							Save
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
