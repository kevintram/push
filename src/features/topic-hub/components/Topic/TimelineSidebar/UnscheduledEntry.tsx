import {
	useDeleteMutation,
	useRevalidateTables,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { Calendar as CalendarIcon, MoreHorizontal, Trash } from 'lucide-react'
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
import { Input } from '~/components/ui/Input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

interface UnscheduledEntryProps {
	entry: Tables<'timeline_entries'>
}

export function UnscheduledEntry({ entry }: UnscheduledEntryProps) {
	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'timeline_entries' },
		{ schema: 'public', table: 'timeline_entries_today' },
		{ schema: 'public', table: 'timeline_entries_with_effective_date' }
	])

	const { mutateAsync: updateTimelineEntry } = useUpdateMutation(
		supabase.from('timeline_entries'),
		['id']
	)

	const { mutateAsync: deleteTimelineEntry } = useDeleteMutation(
		supabase.from('timeline_entries'),
		['id']
	)

	const handleToggleComplete = useCallback(
		(checked: boolean) => {
			updateTimelineEntry({
				id: entry.id,
				completed_at: checked ? new Date().toISOString() : null
			})
		},
		[entry.id, updateTimelineEntry]
	)

	const updateDescription = useCallback(
		(description: string) => {
			updateTimelineEntry({
				id: entry.id,
				description
			})
		},
		[entry.id, updateTimelineEntry]
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: entry.description || '',
		onSave: updateDescription,
		key: `timeline-entry-${entry.id}`
	})

	const textareaRef = useAutoResizeTextarea(description)
	const isCompleted = !!entry.completed_at

	// Check if entry was created recently (within last 10 seconds)
	const isRecentlyCreated = useMemo(() => {
		const now = new Date()
		const createdAt = new Date(entry.inserted_at)
		const timeDiff = now.getTime() - createdAt.getTime()
		return timeDiff < 10_000 // 10 seconds
	}, [entry.inserted_at])

	// Auto-focus if description is empty AND entry was recently created
	const shouldAutoFocus = description === '' && isRecentlyCreated

	const [isSchedulePopoverOpen, setIsSchedulePopoverOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())

	const handleDelete = useCallback(async () => {
		if (entry?.id) {
			await deleteTimelineEntry({ id: entry.id })
		}
	}, [deleteTimelineEntry, entry?.id])

	const handleSchedule = useCallback(() => {
		updateTimelineEntry(
			{
				id: entry.id,
				scheduled_at: selectedDate.toISOString()
			},
			{
				onSuccess: () => {
					revalidateTables()
				}
			}
		)
		setIsSchedulePopoverOpen(false)
	}, [entry.id, selectedDate, updateTimelineEntry, revalidateTables])

	return (
		<div className='group flex items-start gap-2.5 py-1'>
			<Checkbox
				checked={isCompleted}
				className='mt-0.5'
				onCheckedChange={handleToggleComplete}
			/>
			<div className='min-w-0 flex-1'>
				<Textarea
					autoFocus={shouldAutoFocus}
					className={`min-h-[32px] w-full resize-none border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 ${
						isCompleted ? 'text-muted-foreground line-through' : ''
					}`}
					onChange={onDescriptionChange}
					placeholder='New Entry'
					ref={textareaRef}
					style={{ backgroundColor: 'transparent' }}
					value={description}
				/>
			</div>

			{/* Action buttons - only visible on hover */}
			<div className='mt-0.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
				{/* Schedule button */}
				{/* Schedule popover */}
				<Popover
					onOpenChange={setIsSchedulePopoverOpen}
					open={isSchedulePopoverOpen}
				>
					<PopoverTrigger asChild={true}>
						<Button
							className='h-6 w-6 p-0'
							onClick={() => setIsSchedulePopoverOpen(true)}
							size='sm'
							title='Schedule'
							variant='ghost'
						>
							<CalendarIcon className='h-3 w-3' />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						align='start'
						className='w-80 p-6'
						side='right'
						sideOffset={10}
					>
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
							<div className='flex w-full justify-end gap-2'>
								<Button onClick={handleSchedule}>Save</Button>
							</div>
						</div>
					</PopoverContent>
				</Popover>

				{/* More options dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true}>
						<Button
							className='h-6 w-6 p-0'
							size='sm'
							title='More options'
							variant='ghost'
						>
							<MoreHorizontal className='h-3 w-3' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align='end'
						avoidCollisions={true}
						side='bottom'
						sideOffset={4}
					>
						<DropdownMenuItem onClick={handleDelete}>
							<Trash className='mr-2 h-4 w-4' />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)
}
