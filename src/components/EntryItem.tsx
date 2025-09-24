import {
	useDeleteMutation,
	useRevalidateTables,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { Link } from '@tanstack/react-router'
import { CalendarIcon, MoreVertical, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Calendar } from '~/components/ui/Calendar'
import { Checkbox } from '~/components/ui/Checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { Textarea } from '~/components/ui/Textarea'
import { isOverdue } from '~/features/topic-hub/utils/isOverdue'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Tables } from '~/types/database.types'
import { dateOf } from '~/utils/dateOf'
import { supabase } from '~/utils/supabase'

// TODO: clean up this mess when migrate to hono API
type TimelineEntry = (
	| Tables<'timeline_entries'>
	| Tables<'timeline_entries_with_effective_date'>
) & { topics: { name: string } | null }

interface EntryItemProps {
	entry: TimelineEntry
	isCompleted?: boolean
}

export function EntryItem({ entry, isCompleted = false }: EntryItemProps) {
	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'timeline_entries' },
		{ schema: 'public', table: 'timeline_entries_today' },
		{ schema: 'public', table: 'timeline_entries_with_effective_date' }
	])

	const dateValue = (() => {
		if ('effective_date' in entry && entry.effective_date) {
			return entry.effective_date
		}
		if (isCompleted) {
			return entry.completed_at
		}
		return entry.scheduled_at
	})()
	const dateLabel = dateOf(dateValue)?.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	})

	const isOverdueValue = useMemo(
		() =>
			isOverdue({
				scheduledDate: entry.scheduled_at,
				isCompleted
			}),
		[isCompleted, entry.scheduled_at]
	)

	const [isChecked, setIsChecked] = useState(isCompleted)
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date>(
		dateOf(entry.scheduled_at)!
	)
	const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false)

	const { mutateAsync: updateTimelineEntryMutation } = useUpdateMutation(
		supabase.from('timeline_entries'),
		['id'],
		'*, topics(name)',
		{
			onSuccess: () => {
				revalidateTables()
			}
		}
	)

	const { mutateAsync: deleteTimelineEntryMutation } = useDeleteMutation(
		supabase.from('timeline_entries'),
		['id']
	)

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			setIsChecked(checked)
			updateTimelineEntryMutation({
				id: entry.id ?? undefined,
				completed_at: checked ? new Date().toISOString() : null
			})
		},
		[entry.id, updateTimelineEntryMutation]
	)

	const updateDescription = useCallback(
		(newDescription: string) => {
			updateTimelineEntryMutation({
				id: entry.id ?? undefined,
				description: newDescription.trim()
			})
		},
		[entry.id, updateTimelineEntryMutation]
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: entry.description || '',
		onSave: updateDescription,
		key: `timeline-entry-${entry.id}`
	})

	const handleDateSave = useCallback(
		(newDate: Date) => {
			setSelectedDate(newDate)
			updateTimelineEntryMutation({
				id: entry.id ?? undefined,
				scheduled_at: newDate.toISOString()
			})
			setIsDatePopoverOpen(false)
		},
		[entry.id, updateTimelineEntryMutation]
	)

	const handleDelete = useCallback(async () => {
		await deleteTimelineEntryMutation({ id: entry.id ?? undefined })
		revalidateTables()
	}, [entry.id, deleteTimelineEntryMutation, revalidateTables])

	return (
		<div className='group rounded-lg p-4'>
			<div className='flex flex-col gap-2'>
				{/* Row 1: Checkbox + Description + Date + More Button */}
				<div className='flex items-start gap-4'>
					{/* Checkbox */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper div to prevent event propagation to parent */}
					{/* biome-ignore lint/nursery/noNoninteractiveElementInteractions: wrapper div to prevent event propagation to parent */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper div only prevents propagation, keyboard interaction handled by child Checkbox */}
					<div
						onClick={e => {
							e.preventDefault()
							e.stopPropagation()
						}}
					>
						<Checkbox
							checked={isChecked}
							className={`mt-1 ${isOverdueValue ? 'border-red-500 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500' : ''}`}
							onCheckedChange={handleCheckboxChange}
						/>
					</div>

					{/* Description */}
					<Textarea
						className='!bg-transparent mb-1 min-h-[1.5rem] flex-1 resize-none border-0 p-0 text-md leading-relaxed shadow-none focus:border-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-transparent focus-visible:ring-0'
						onChange={onDescriptionChange}
						placeholder='Description'
						rows={1}
						value={description}
					/>

					{/* Date and More Actions */}
					<div className='flex items-center gap-0'>
						{/* Date */}
						<Popover
							onOpenChange={setIsDatePopoverOpen}
							open={isDatePopoverOpen}
						>
							<PopoverTrigger asChild={true}>
								<Button
									className='h-auto whitespace-nowrap p-1 text-muted-foreground text-sm hover:bg-muted/50'
									size='sm'
									variant='ghost'
								>
									<CalendarIcon className='mr-1 h-3 w-3' />
									{dateLabel}
								</Button>
							</PopoverTrigger>
							<PopoverContent align='end' className='w-auto p-4'>
								<div className='space-y-4'>
									<Calendar
										mode='single'
										onSelect={date => {
											if (date) {
												handleDateSave(date)
											}
										}}
										selected={selectedDate}
									/>
									<div className='flex items-center gap-2'>
										<input
											className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
											onChange={e => {
												if (e.target.value) {
													const newDate = new Date(e.target.value)
													handleDateSave(newDate)
												}
											}}
											type='date'
											value={selectedDate?.toISOString().split('T')[0]}
										/>
									</div>
								</div>
							</PopoverContent>
						</Popover>

						{/* More Actions Dropdown */}
						<DropdownMenu
							onOpenChange={setIsMoreDropdownOpen}
							open={isMoreDropdownOpen}
						>
							<DropdownMenuTrigger asChild={true}>
								<Button
									className='h-6 w-6 p-0 text-muted-foreground hover:text-foreground'
									size='sm'
									variant='ghost'
								>
									<MoreVertical className='h-3 w-3' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-32'>
								<DropdownMenuItem
									className='text-red-600 focus:text-red-600'
									onClick={() => {
										handleDelete()
										setIsMoreDropdownOpen(false)
									}}
								>
									<Trash2 className='mr-2 h-4 w-4' />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Row 2: Spacer + Topic */}
				<div className='flex items-center gap-2'>
					{/* Spacer (same width as checkbox) */}
					<div className='w-6' />

					{/* Topic */}
					<div className='flex-1'>
						{entry.topics?.name && (
							<Link
								className='break-word text-muted-foreground text-sm [overflow-wrap:anywhere] hover:underline'
								params={{ topicId: entry.topic_id?.toString() ?? '' }}
								to='/topics/{-$topicId}'
							>
								{entry.topics.name}
							</Link>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
