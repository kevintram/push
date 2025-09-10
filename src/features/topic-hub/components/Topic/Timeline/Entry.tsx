import {
	useDeleteMutation,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { MoreVertical, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
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
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { dateOf } from '../../../../../utils/dateOf'
import { numDaysElapsed } from '../../../utils/daysElapsed'
import { isOverdue } from '../../../utils/isOverdue'
import { DaysElapsedMarker } from './DaysElapsedMarker'
import { EditEntry } from './EditEntry'

export function Entry({
	entry,
	index,
	nextDate
}: {
	entry: Tables<'timeline_entries_with_effective_date'>
	index: number
	nextDate?: Date | undefined // undefined if last entry
}) {
	// TODO: Implement count based on timeline_entry_practice_cards
	// const reviewedItemsCount = 0

	// TODO: Implement stability change and retrievability with SRS logic
	// const stabilityChange = currEntry.stability_change
	// const retrievability = currEntry.retrievability

	const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false)
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)

	const { mutateAsync: updateTimelineEntryMutation } = useUpdateMutation(
		supabase.from('timeline_entries_with_effective_date'),
		['id'],
		'*'
	)

	const { mutateAsync: deleteTimelineEntryMutation } = useDeleteMutation(
		supabase.from('timeline_entries_with_effective_date'),
		['id']
	)

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			updateTimelineEntryMutation({
				id: entry.id,
				completed_at: checked ? new Date().toISOString() : null
			})
		},
		[entry.id, updateTimelineEntryMutation]
	)

	const handleDelete = useCallback(() => {
		deleteTimelineEntryMutation({ id: entry.id })
		setIsDropdownOpen(false)
	}, [entry.id, deleteTimelineEntryMutation])

	const effectiveDate: Date = useMemo(() => {
		return dateOf(entry.effective_date)!
	}, [entry.effective_date])

	const isOverdueValue: boolean = useMemo(() => {
		return isOverdue({
			scheduledDate: entry.scheduled_at,
			isCompleted: entry.completed_at !== null
		})
	}, [entry.scheduled_at, entry.completed_at])

	return (
		<div className='flex flex-row gap-3'>
			<div className='flex flex-col items-start'>
				<div className='flex items-center gap-2'>
					<Checkbox
						checked={!!entry.completed_at}
						className={
							isOverdueValue
								? 'border-red-600 dark:border-red-700 dark:bg-red-700'
								: ''
						}
						onCheckedChange={handleCheckboxChange}
					/>

					<Popover onOpenChange={setIsEditPopoverOpen} open={isEditPopoverOpen}>
						<PopoverTrigger asChild={true}>
							<Badge variant='default'>
								{effectiveDate.toLocaleDateString()}
							</Badge>
						</PopoverTrigger>
						<PopoverContent
							align='start'
							className='w-80 p-6'
							side='right'
							sideOffset={10}
						>
							<EditEntry
								entry={entry}
								onClose={() => setIsEditPopoverOpen(false)}
							/>
						</PopoverContent>
					</Popover>
				</div>

				<div className='ml-10'>
					{nextDate && (
						<DaysElapsedMarker
							daysElapsed={numDaysElapsed(effectiveDate, nextDate)}
						/>
					)}
				</div>
			</div>

			<div className='flex flex-1 flex-row items-start gap-2 py-1'>
				<div className='flex-1 text-foreground text-xs'>
					{entry.description}
				</div>
				<div className='flex items-start gap-1'>
					<div className='font-medium text-muted-foreground text-xs'>
						{index + 1}
					</div>
					<DropdownMenu onOpenChange={setIsDropdownOpen} open={isDropdownOpen}>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='h-4 w-4 p-0 text-muted-foreground hover:text-foreground'
								variant='ghost'
							>
								<MoreVertical className='h-3 w-3' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
							<DropdownMenuItem
								className='text-red-600 focus:text-red-600'
								onClick={handleDelete}
							>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
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
